# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Creevey is a cross-browser screenshot testing tool for [Storybook](https://storybook.js.org/). It captures screenshots of Storybook stories, compares them against reference images using pixelmatch or odiff, and provides a web UI for reviewing and approving results.

## Commands

- **Build**: `yarn build` (clean + vite client build + tsc compile + copy files)
- **Build client only**: `yarn build:client` (vite build of React web UI)
- **Build server only**: `yarn build:creevey` (tsc with `tsconfig.prod.json`)
- **Lint**: `yarn lint` (runs tsc, oxlint, oxfmt in parallel via concurrently)
- **Fix**: `yarn fix` (auto-fix oxlint and oxfmt issues)
- **Test all**: `yarn test` (vitest run, tests in `tests/**/*.test.ts`)
- **Single test**: `yarn test tests/shared/helpers.test.ts`
- **Test watch**: `yarn test:watch`
- **Dev server**: `yarn start` (starts vite dev server on :8000, storybook on :6006, and creevey UI concurrently)
- **Run creevey locally**: `yarn creevey test --ui` (uses tsx to run from source)

## Architecture

### Master-Worker Pattern

Creevey uses Node.js `cluster` module for parallel test execution:

- **CLI** (`src/creevey.ts`) — Parses commands (`test`, `report`, `worker`) with `cac`, validates options with `valibot` (`src/schema.ts`), then delegates to `src/server/index.ts`
- **Master process** (`src/server/master/`) — Orchestrates everything: discovers stories, manages the test queue, spawns cluster workers, aggregates results, runs HTTP/WebSocket server for the UI
- **Worker processes** (`src/server/worker/`) — Each worker controls one browser instance via Selenium or Playwright, executes tests, captures screenshots, performs image comparison, reports results back via cluster IPC

### Key Master Components

- `master.ts` — Initializes `TestsManager` and `Runner`, loads tests from stories
- `runner.ts` — Coordinates test execution across browser `Pool`s, emits events for the reporter system
- `pool.ts` — Manages a group of cluster workers for a single browser type
- `queue.ts` — `WorkerQueue` handles sequential/parallel worker forking
- `testsManager.ts` — Central test data store: loading, saving, merging, approving results. Extends `EventEmitter`
- `api.ts` — `CreeveyApi` class: WebSocket-based real-time communication with UI (start/stop/approve/status)
- `server.ts` — HTTP server with static file serving, WebSocket upgrade, REST handlers for stories/capture/ping

### Stories Providers (`src/server/providers/`)

Two strategies for extracting stories from Storybook:

- **`browser.ts`** — Connects to running Storybook, extracts stories via cluster worker that loads the Storybook iframe
- **`hybrid.ts`** (default) — Combines browser provider with parsing of `.creevey.ts` test files from the filesystem. Merges story parameters with test definitions. This is the only provider going forward (`storiesProvider` config is deprecated)

### Webdriver Abstraction

Both webdrivers implement the `CreeveyWebdriver` interface (`src/types.ts`):

- **Selenium** (`src/server/selenium/`) — Uses selenium-webdriver, supports Selenoid for Docker, Selenium Grid for cloud providers
- **Playwright** (`src/server/playwright/`) — Uses playwright-core, supports Docker containers and local browsers. Grid URL scheme `creevey://chromium` triggers local launch

Selection is controlled by `config.webdriver` (either `SeleniumWebdriver` or `PlaywrightWebdriver`).

### Test File Parsing (`src/server/testsFiles/parser.ts`)

Parses `.creevey.(m|c)?(t|j)s` files (configurable via `config.testsRegex`) to extract `CreeveyStoryParams` keyed by story ID. Uses `tsx` for TypeScript loading.

### Image Comparison (`src/server/compare.ts`)

Two engines: **pixelmatch** (default, JS) and **odiff** (optional, Rust-based via `odiff-bin`). Both compare actual vs expected PNGs and produce diff images stored in the report directory.

### Client UI (`src/client/`)

- **`web/`** — Standalone React app (Vite, SWC) served by the creevey server. Uses `use-immer` for state, Storybook theming, WebSocket for real-time updates
- **`shared/`** — `CreeveyClientApi` (WebSocket client), helper functions for test tree manipulation, image viewer components (side-by-side, swap, slide, blend modes)

### IPC & Messaging (`src/server/messages.ts`)

All inter-process communication uses typed `ProcessMessage` with scopes: `worker`, `stories`, `test`, `shutdown`. Messages are sent via `cluster` IPC (master↔worker) or `process.emit` (same-process).

### Reporters (`src/server/reporters/`)

Mocha-compatible reporter interface. Built-in: `creevey` (default), `teamcity` (auto-detected via `TEAMCITY_VERSION` env), `junit`. Custom reporters can be provided in config.

## Code Style

- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`
- Module system: `"type": "module"` in package.json with `"module": "NodeNext"` in tsconfig (ESM output)
- All internal imports use `.js` extension (TypeScript ESM-style resolution)
- oxfmt (Prettier-compatible): single quotes, 120 char width, trailing commas
- oxlint with plugins: eslint, typescript, unicorn, oxc, react, react-hooks, import
- React: functional components with hooks only
- Husky pre-commit hooks run lint-staged (oxlint + oxfmt on staged files)

## Key Types (`src/types.ts`)

- `Config` / `CreeveyConfig` — Full and partial configuration
- `BrowserConfigObject` — Per-browser settings (name, viewport, grid URL, Docker image, Playwright/Selenium options)
- `CreeveyWebdriver` — Browser automation interface
- `ServerTest` / `TestData` / `TestMeta` — Test lifecycle types
- `CreeveyTestContext` — Test execution context (webdriver, takeScreenshot, matchImage, updateStoryArgs)
- `CreeveySuite` / `CreeveyTest` — UI tree structure for test results
- `Request` / `Response` — WebSocket API message types

## Package Exports

```
creevey           → src/index.ts (types + story providers + parser)
creevey/playwright → src/playwright.ts (PlaywrightWebdriver)
creevey/selenium  → src/selenium.ts (SeleniumWebdriver)
creevey/playwright/test     → Playwright test generator
creevey/playwright/setup    → Playwright setup
creevey/playwright/reporter → Playwright reporter
```

## Memory Synchronization

**CRITICAL**: After making any changes to the project, you MUST update the files in `memories/` to reflect the current project state. The memories should always provide an accurate, up-to-date description of the project.

- Do not document summary about every minor change in memories
- Keep memories fresh and relevant to current project state
- Update memories when architectural changes occur
- Update memories when new patterns are established
- Update memories when significant features are added/removed

## Related Documentation

- `memories/memory.md` - Primary AI knowledge base
- `memories/architecture.md` - Technical architecture details
- `memories/workflow.md` - Development workflows and processes
- `memories/testing.md` - Testing strategies and patterns
- `memories/troubleshooting.md` - Common issues and solutions
- `docs/` - User-facing documentation (config, CLI, storybook params, playwright reporter, grid setup)
