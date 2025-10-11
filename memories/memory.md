# Creevey AI Knowledge Base

## Project Overview

Creevey is a cross-browser screenshot testing tool for Storybook with a fancy UI Runner. It enables visual regression testing by capturing screenshots of Storybook stories and comparing them against reference images.

### Core Purpose

- Visual regression testing for Storybook components
- Cross-browser compatibility testing
- Interactive test writing with webdriver support
- Web-based test runner and result reviewer

### Technology Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js >=18
- **Package Manager**: Yarn 4.9.1
- **Testing**: Vitest
- **Build**: Vite + TypeScript compiler
- **Webdrivers**: Selenium WebDriver & Playwright
- **UI**: React with hooks
- **Image Comparison**: pixelmatch & odiff
- **Containerization**: Docker (optional)

## Project Structure

```
src/
├── client/                 # Frontend UI components
│   ├── shared/            # Shared client utilities
│   └── web/               # Web UI application
├── playwright/            # Playwright integration
├── server/                # Backend server logic
│   ├── master/            # Test orchestration
│   ├── playwright/        # Playwright webdriver
│   ├── providers/         # Stories providers
│   ├── reporters/         # Test reporters
│   ├── selenium/          # Selenium webdriver
│   ├── testsFiles/        # Test file parsing
│   └── worker/            # Test execution workers
├── shared/                # Shared utilities
├── cli.ts                 # CLI entry point
├── creevey.ts             # Main library entry
├── playwright.ts          # Playwright export
├── selenium.ts            # Selenium export
└── types.ts               # TypeScript definitions
```

## Key Concepts

### Stories Providers

- **browserStoriesProvider**: Extracts stories directly from Storybook UI (deprecated)
- **hybridStoriesProvider**: Combines Storybook stories with separate test files (default, will be only option in future)

> **Note**: The `storiesProvider` config property is deprecated. Creevey will use only `hybridStoriesProvider` in future versions. Users can safely remove this property from their config.

### Webdrivers

- **SeleniumWebdriver**: Traditional Selenium WebDriver (backward compatibility)
- **PlaywrightWebdriver**: Modern Playwright browser automation (recommended)

### Test Types

- **Static screenshots**: Capture component states without interaction
- **Interactive tests**: Use webdriver actions to test component behavior
- **Storybook play functions**: Native Storybook test execution

### Configuration

- Located in `.creevey/config.ts` or `creevey.config.ts`
- Supports TypeScript with full type safety
- Browser-specific configurations
- Docker and CI integration options

## Entry Points

### CLI Commands

```bash
# Run tests with UI
yarn creevey test --ui

# Start Storybook automatically
yarn creevey test -s --ui

# Review test results
yarn creevey report
```

### Library Exports

```typescript
// Main library
import { Config, CreeveyTestContext } from 'creevey';

// Webdriver-specific
import { PlaywrightWebdriver } from 'creevey/playwright';
import { SeleniumWebdriver } from 'creevey/selenium';

// Stories providers
import { browserStoriesProvider, hybridStoriesProvider } from 'creevey';
```

## Development Workflow

### Build Commands

```bash
yarn build          # Full build (clean + client + compile + copy)
yarn build:client   # Build frontend UI only
yarn build:creevey  # Compile TypeScript only
```

### Testing

```bash
yarn test           # Run all tests
yarn test path/to/test.test.ts  # Run specific test
yarn test:watch     # Watch mode for development
```

### Code Quality

```bash
yarn lint           # Type check + ESLint + Prettier check
yarn fix            # Auto-fix ESLint and Prettier issues
```

### Development Server

```bash
yarn start          # Start client + Storybook + Creevey UI
```

## Configuration Patterns

### Basic Setup

```typescript
// creevey.config.ts
import { CreeveyConfig } from 'creevey';
import { PlaywrightWebdriver } from 'creevey/playwright';

const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver,
  storybookUrl: 'http://localhost:6006',
  browsers: {
    chrome: {
      browserName: 'chromium',
      viewport: { width: 1024, height: 768 },
    },
  },
};

export default config;
```

### Test Files

```typescript
// stories/Component.creevey.ts
import { story, test } from 'creevey';

story('ComponentStory', () => {
  test('default', async (context) => {
    await context.matchImage(await context.takeScreenshot());
  });

  test('with interaction', async (context) => {
    await context.webdriver.click('[data-testid="button"]');
    await context.matchImage(await context.takeScreenshot());
  });
});
```

## Common Tasks

### Adding New Browser Support

1. Update browser configuration in config file
2. Specify browserName and capabilities
3. Configure Docker image if needed

### Writing Interactive Tests

1. Create `.creevey.ts` files alongside stories
2. Use webdriver API for interactions
3. Capture screenshots at different states
4. Use `matchImage` for assertions

### Debugging Test Failures

1. Use `--debug` flag for detailed logs
2. Check report directory for diff images
3. Review test logs in UI or console
4. Verify Storybook is accessible

### CI Integration

1. Set `useDocker: false` for cloud CI
2. Configure browser installation
3. Use appropriate reporter (junit, teamcity)
4. Handle screenshot storage in artifacts

## File Locations

- **Config**: `.creevey/config.ts` or `creevey.config.ts`
- **Tests**: `**/*.creevey.ts` (configurable via `testsRegex`)
- **Reference Images**: `./images` (configurable via `screenDir`)
- **Test Reports**: `./report` (configurable via `reportDir`)
- **Build Output**: `./dist`

## Important Notes

- Always specify webdriver explicitly (SeleniumWebdriver or PlaywrightWebdriver)
- Use hybridStoriesProvider for interactive tests
- Configure appropriate timeouts for complex interactions
- Consider Docker for consistent test environments
- Use fail-fast mode for quick CI feedback
- Enable debug mode for troubleshooting

## Related Documentation

- `AI_ARCHITECTURE.md` - Technical architecture details
- `AI_WORKFLOW.md` - Development workflows and processes
- `AI_TESTING.md` - Testing strategies and patterns
- `AI_TROUBLESHOOTING.md` - Common issues and solutions
- `docs/` - User-facing documentation
- `AGENTS.md` - Development guidelines for AI agents
