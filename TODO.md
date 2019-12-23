# TODO

<details>
<summary>Done</summary>

- [x] Test types
- [x] Add binary
- [x] Subscribe on workers ready
- [x] Parallel (need prebuild? worker-farm?)
  - [x] Custom server runner
  - [x] Patch mocha runner with cluster
- [x] Allow customize hooks to non-storybook env
- [x] Defined default config + deep merge
- [x] Build correct `d.ts` files. For now, you should remove require types from `lib/creevey.js` after build.
- [x] Pass `config` to server initialization (use process.cwd())
- [x] Single fork for single browser thread
- [x] Mocha workers for server
- [x] Add test parser
- [x] Selenium keep alive
- [x] Allow start/stop tests
- [x] reconnect to selenium (sending keep-alive)
- [x] subscribe websocket api (status commands)
- [x] websocket api types
- [x] Generate static page in report dir
- [x] Save/Load results in/from report dir (js/json)
- [x] Save images report in multiple runs
- [x] Not graceful exit master process on error in workers
- [x] Add worker timeout and restart it
- [x] ~~Ignore elements from screenshot~~
- [x] Custom mocha reporter for worker
- [x] Allow to use Teamcity reporter
- [x] Add worker ready event
- [x] Support load test files from glob patterns
- [x] Better handle websocket messages
- [x] Allow define sets (test files, address, browsers)
  - [x] Filter tests by path in parser
  - [x] Merge common config with browser config
- [x] Web interface
  - [x] webpack build
  - [x] usage react-ui
  - [x] output tests tree
  - [x] allow start/stop
  - [x] comm with API by test id
  - [x] approve images
  - [x] Offile mode, load report data
  - [x] Output test error message
  - [x] output reported images
  - [x] better images view like github does
    - [x] SlideView
    - [x] BlendView
  - [x] switch images by hotkeys
  - [x] output test status (pending)
  - [x] update/recalc suite status
  - [x] use classnames (emotion)
  - [x] ApprovedRetry
  - [x] Fix incorrect output new images
  - [x] output skipped tests
  - [x] Output test error message
  - [x] Fit large images inside TestResultView
  - [x] Allow view fullscale images
  - [x] Invert expect/actual color
  - [x] Better output test error message
- [x] Test grep regexp dont work with parenthesis
- [x] Don't respect skip flag from report json
- [x] Browser resolution option
- [x] Fix TeamCity reporter `<unknown test name>`
- [x] Output images for Teamcity reporter
- [x] Setup viewport size
- [x] Color output in console
- [x] Server state sync
- [x] Config npmignore files
- [x] Status runner
- [x] Add Storybook for web ui components
- [x] Restart selenium driver on timeout
- [x] Export decorator from creevey
- [x] Improve ts support for creevey (like webpack does)
  - [x] Don't work with ts-node + esnext modules
- [x] Define simple version for browsers
- [x] Simplify types re-export for lib usage
- [x] Calc correct viewport size
- [x] Fix skip/unskip tests between run without delete report dir
- [x] Allow clean approved images
- [x] Generate runtime tests based on stories
- [x] Reload IE page on start (don't handle storybook hotreload)
- [x] Allow leave reason comment for skiped tests
- [x] Update args readme (config, parser, ...)
- [x] Add cli arguments
  - [x] config
  - [x] parser
  - [x] ui
  - [x] reporter
  - [x] update
  - [x] ~~init~~
  - [x] port
- [x] Storybook integration
  - [x] Update to Storybook@5.x
  - [x] Reset mouse position
  - [x] Support sotrybook 3.x-5.x
- [x] Allow Composite images
- [x] Slide story don't work correclty, must be fixed
- [x] Better error message about open storybook page
- [x] Exit if worker got `UnhandledPromiseRejectionWarning`
- [x] Serialize skip regexp
- [x] Husky, lint-staged
- [x] Rework UI

  - [x] Improve UI performance on initial load
  - [x] Put tests tree into side page
  - [x] Output test result view into main page block
  - [x] Output error message multiline
  - [x] Show icons for skiped tests
  - [x] Allow check/uncheck tests without results

  </details>

## First priority

- [ ] Bugs
  - [ ] Update incorrect work with new struct direcotry
  - [x] Reset button nowrap style
  - [x] Skip by browser regexp don't work (webdriver serialization)
- [ ] Allow assert multiple images in one test (chai toMatchImages())
- [ ] Storybook integration
  - [x] Simplify generated tests tree acording by stories/tests/images
  - [ ] Move Creevey config inside storybook config
  - [ ] Use require.context from storybook config or strorybook event to get tests (without \_\_filename usage)
  - [ ] Note about support only Component Story Format (CSF)
  - [ ] Add note about skip option and story/kind name case convention
  - [ ] Add screencast with Creevey UI
- [ ] Transform to monorepo
  - [ ] `chai-image`
  - [ ] `jest-image`
  - [ ] `creevey`
  - [ ] `creevey-ui`
  - [ ] `creevey-album` (storybook decorator and integration)
  - [ ] `creevey-selenium`
- [ ] Use jest intead of mocha/chai

## Not in first time

- [ ] Correctly resize images in views using correct proportions (smaller image should shrink if larger shrink too, max-width/max-height doesn't work)
- [ ] Tests on images view components with various scenarios (same/diff sizes, less/bigger viewport)
- [ ] Write stories on new components
  - [x] SideBar
  - [ ] ResultPageHeader
- [ ] Allow skip tests inside story
- [ ] Bugs
  - [ ] Firefox double click if clicks in different tests
  - [ ] Reconnect on `WebDriverError: Session timed out or not found`
  - [ ] Mocha worker `Possible EventEmitter memory leak detected. 11 error listeners added`
  - [ ] Not properly work with CRA (need to install ts-node or @babel/register)
- [ ] Improve CLI
  - [ ] Output cli help
  - [ ] Add grep/kind/story option
- [ ] Rework UI
  - [ ] Show removed tests results, mark these as removed
  - [ ] Allow hide skipped tests in UI
  - [ ] Add bottom padding into test tree
  - [ ] Allow switch between 1:1 and fit image views
- [ ] Write about differences with other tools
- [ ] Add unit tests
- [ ] Add `babel-plugin-typescript-to-proptypes`
- [ ] Lint sort imports
- [ ] Github Actions
- [ ] Storybook integration
  - [ ] Support stories separators https://storybook.js.org/docs/basics/writing-stories/#story-hierarchy
  - [ ] Support stories name convention https://storybook.js.org/docs/formats/component-story-format/#storybook-export-vs-name-handling
- [ ] Rewrite to use `worker_threads` instead of `cluster` to allow use shared memory
- [ ] Use https://github.com/gidztech/jest-puppeteer-docker
- [ ] Allow use custom API (wd/wdio/puppeter/etc)
- [ ] HotReload tests files without restart
- [ ] Handle error on mocha hooks
- [ ] Support mocha options for workers
- [ ] Allow define mocha hooks
- [ ] Programmic API
- [ ] Add logger lib

## Far future

- [ ] Allow use creevey without storybook
- [ ] Storybook integration
  - [ ] Render tests UI as a part of storybook UI
  - [ ] Framework agnostic decorator

## Maybe Never

- [ ] vscode mocha explorer
  - [ ] codelens run not work (need full path)
  - [ ] tests run with default timeout even if it changed in config
  - [ ] cwd and require conflict each other
  - [ ] mocha opts and mocha bin is not prefect support
- [ ] Use own runner instead of mocha
