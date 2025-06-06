# TODO

<details>
<summary>Done</summary>

- [x] Test types
- [x] Add binary
- [x] Subscribe on workers ready
- [x] Parallel (need pre-build? worker-farm?)
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
  - [x] Offline mode, load report data
  - [x] Output test error message
  - [x] output reported images
  - [x] better images view like github does
    - [x] SlideView
    - [x] BlendView
  - [x] switch images by hotkeys
  - [x] output test status (pending)
  - [x] update/re-calc suite status
  - [x] use classnames (emotion)
  - [x] ApprovedRetry
  - [x] Fix incorrect output new images
  - [x] output skipped tests
  - [x] Output test error message
  - [x] Fit large images inside TestResultView
  - [x] Allow view fullscale images
  - [x] Invert expect/actual color
  - [x] Better output test error message
- [x] Test grep regexp don't work with parenthesis
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
- [x] Reload IE page on start (don't handle storybook hot-reload)
- [x] Allow leave reason comment for skipped tests
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
  - [x] Support storybook 3.x-5.x
  - [x] Simplify generated tests tree according by stories/tests/images
  - [x] Use require.context from storybook config or storybook event to get tests (without \_\_filename usage)
  - [x] Add note about skip option and story/kind name case convention
  - [x] Storybook support 5.3 declarative config https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#from-version-52x-to-53x
  - [x] Support stories name convention https://storybook.js.org/docs/formats/component-story-format/#storybook-export-vs-name-handling
  - [x] Framework agnostic decorator
  - [x] Add `didCatch` method to storybook decorator. Handle errors while switch stories
- [x] Allow Composite images
- [x] Slide story don't work correctly, must be fixed
- [x] Better error message about open storybook page
- [x] Exit if worker got `UnhandledPromiseRejectionWarning`
- [x] Serialize skip regexp
- [x] Husky, lint-staged
- [x] Rework UI
  - [x] Improve UI performance on initial load
  - [x] Put tests tree into side page
  - [x] Output test result view into main page block
  - [x] Output error message multiline
  - [x] Show icons for skipped tests
  - [x] Allow check/uncheck tests without results
  - [x] Add bottom padding into test tree
- [x] Update incorrect work with new structure directory
- [x] Reset button nowrap style
- [x] Skip by browser regexp don't work (webdriver serialization)
- [x] Convert storycase to export name
- [x] Allow assert multiple images in one test (chai toMatchImages())
- [x] Remove Loader, use require.context
- [x] Remove tests parser ability, support only storybook
- [x] ~~Add `babel-plugin-typescript-to-proptypes`~~ Seems this plugin doesn't do so much
- [x] Allow skip tests inside story
- [x] ~~Not properly work with CRA (need to install ts-node or @babel/register)~~ Add notes in readme
- [x] ~~Lint sort imports~~
- [x] ~~Allow define mocha hooks~~
- [x] Optimize stories load process (don't import other stuff like react, components and other browser libs/styles/images/fonts)
- [x] Don't output tests without status if filtering by status
- [x] Patch @babel/register hook to allow use '.ts' along side with '.tsx' extensions
- [x] HotReload tests files without restart
- [x] **has workaround** Can't use `By` and `Key` helpers from `selenium-webdriver` in tests, because webpack try to build bundle with `selenium-webdriver`
- [x] Chai used as deps, but in stories should imported explicitly. Add chai to peerdeps
- [x] Add description for types properties, like config/decorator/etc
- [x] Init pirates before any compiler (fix error with ts-node (allowJs: true) and pirates order)
- [x] Add `delay` option for stories. To allow wait some time before real test started (right after switch story)
- [x] Add composite screenshot helper (this.takeScreenshot should be composite)
- [x] Don't apply scrollbar hiding styles in composite images
- [x] Add authors
- [x] Handle error on mocha hooks
- [x] Bugs
  - [x] Reconnect on `WebDriverError: Session timed out or not found`
  - [x] On Teamcity cli exits with -1 code without any output
  - [x] Don't handle correctly storybook render story errors
  - [x] Readlink don't work on windows. Need to change storybook framework detection
  - [x] Restart workers output errors `NoSuchSessionError: Tried to run command without establishing a connection` and `TypeError: _cluster.default.disconnect is not a function`
  - [x] In chrome 80 creevey sometime failed with error `MoveTargetOutOfBoundsError: move target out of bounds`
  - [x] For firefox composite images captured without scrollbars, but image width has scrollbar width
  - [x] Unexpected loaded state. Did you call `load` twice?
  - [x] [BABEL] Note: The code generator has deoptimised the styling of /home/kich/Projects/creevey/report/storybook/tmp-8207-HTp79b5JhpxQ-.js as it exceeds the max of 500KB.
  - [x] webpack-hot-middleware's client requires EventSource to work. You should include a polyfill if you want to support this browser: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events#Tools
- [x] Cutoff subcomponents parameter
- [x] Apply AST transformation on storybook config directory (cut decorators)
- [x] EPIPE Error on SIGINT :(
- [x] Remove unnecessary deps and code, for example pirates, require.context, interpret, (?)other
- [x] Optimize stories loading
  - [x] Add debug output on fail transformation
  - [x] Use proxy to handle side-effects
  - [x] AST transformation to exclude all source code except stories meta and tests (support only CSF)
- [x] Add examples
  - [x] Angular
  - [x] Create React App
- [x] Docs
  - [x] Update framework examples
  - [x] Add `delay` option
  - [x] Record screencast with Creevey UI
  - [x] Update Readme.md (also describe scenarios or how to capture screenshots)
  - [x] Add topics in top of readme
  - [x] Add instruction for various frameworks
    - [x] Angular
    - [x] Create React App
- [x] Storybook Integration
  - [x] Manually create ClientApi instance, if it doesn't exists
  - [x] ~~Support storybook configs with js extension (4.x and 5.2 versions)~~
  - [x] ~~Support stories separators https://storybook.js.org/docs/basics/writing-stories/#story-hierarchy~~
- [x] ~~Allow define custom extensions to ignore it while story loading process~~
- [x] Github Actions
  - [x] Add linting job
  - [x] Allow run ui tests in cli by `yarn test:ui`

## (v0.6.x)

- [x] Install core-js and regenerator runtime as deps, to fix storybook deps issue, where storybook require own core-js, but module path for bundle resolve incorrect
- [x] Fix match story and absolute path to file with that story (fix hot-reloading issue in CRA)
  - [x] Add note about storybook version

## (v0.7)

- [x] Add same font as Storybook uses
- [x] Update Readme
  - [x] Best practices: "use git-lfs in your repo"
  - [x] Default captureElement: `#root`
  - [x] By default creevey use docker, but you can disable it by specifying gridUrl or override for some browsers
    - [x] About CI, can't simply run docker-in-docker env for now (especially in circle ci because of isolated remote docker. As possible solution use machine executor https://github.com/oblador/loki/issues/183#issuecomment-602669503)
  - [x] `before/after` hooks
  - [x] creevey addon
  - [x] new params config, don't need decorator any more
  - [x] update using types (`export const Slide: Story<React.ComponentProps<typeof ImagesView>> & CreeveyStory = () => ImagesView('slide');`)
  - [x] Why need to use `findElement({ css: 'selector' })`. Improve it in `creevey-selenium` add null-loader
  - [x] Write about differences with other tools
  - [x] How's using Creevey?
  - [x] ~~Add how to start docker and IE11 especially~~
  - [x] Add instruction for various frameworks
    - [x] Vue
- [x] Support Storybook 6.x
- [x] ~~Add @babel/code-frame to output loader error~~ There is babel issue https://github.com/babel/babel/issues/8617
- [x] Support declarative 6.0 decorators format, like this https://github.com/storybookjs/storybook/tree/master/addons/knobs/src/preset
- [x] Store creevey storybook bundle in cache dir using find-cache-dir pkg
- [x] Move addon ImageViews to shared and use it in client UI
- [x] Cleanup nodejs storybook bundle (Don't load any of addons)
- [x] Build addon for ie11
- [x] Add human readable error message if test failed with `window.__CREEVEY_SELECT_STORY__` is not a function
- [x] Update examples
- [x] Add creevey in awesome list
  - https://github.com/mojoaxel/awesome-regression-testing
- [x] Creevey as Addon PoC
- [x] Update Eslint to v7
- [x] Simplify hot-reloading logic, for v6.x fixed removing tests issue
- [x] Bugs
  - [x] Mocha worker `Possible EventEmitter memory leak detected. 11 error listeners added`
  - [x] IPC_CHANNEL_CLOSED error infinity loop, could reproduce with invalid gridUrl
  - [x] Error mocha instance already disposed in mocha@7.2
  - [x] Tests not removing in hot-reloading process
  - [x] Don't end all worker processes, especially if worker has errors
  - [x] Highlight success/failed screenshot previews
  - [x] Creevey don't work with docs addon (cleanup bundle)
  - [x] `export const parameters = {};` in preview.js lead to error `Singleton client API not yet initialized, cannot call addParameters`
  - [x] Storybook addons override creevey parameters in stories (wait fix from storybook, send PR)
  - [x] Add regenerator runtime to report main.js
  - [x] Don't reset scroll on swap images
  - [x] Don't fail build with mdx stories (just ignore it for now)
  - [x] Re-disable animations on storybook reload
  - [x] Don't stop rebuilding if rebuild failed due syntax error
  - [x] Cut off all exports in preview.js except creevey params
  - [x] Client UI don't show statuses on first run
  - [x] Cut off loaders parameters for stories https://github.com/storybookjs/storybook/pull/12699
- [x] Features
  - [x] ~~Add `args` type for CSFStory~~ (Can't support 5.x and 6.x in same time)
  - [x] Support run tests inside docker
  - [x] Allow define saucelabs/browserstack-local init/dispose functions
  - [x] ~~Allow define custom localhost resolver in config~~ (write function for storybookUrl)
  - [x] Output unnecessary images when creevey run from cli
- [x] Storybook integration
  - [x] Render tests UI as a part of storybook UI
- [x] Write stories on new components
  - [x] SideBar
  - [x] ResultPageHeader

</details>

## (v0.7.x)

- [x] Bugs
  - [x] Add timeout to resolver
  - [x] Incorrect merge skip params (global + local)
  - [x] Fix unnecessary images report for windows
  - [x] Store cache inside creevey package dir (fix core-js versions)
  - [x] Correctly resize images in views using correct proportions (smaller image should shrink if larger shrink too, max-width/max-height doesn't work)
  - [x] Scale images properly (Use naturalWidth image prop for scale in views)
  - [x] Images switch freeze
  - [x] creevey-loader `private members`
  - [x] ~~Fix teamcity preview images~~ (TeamCity bug)
  - [x] Fix height in addon
  - [x] ~~Fix firefox 61 in skbkontur selenium grid~~
  - [x] creevey-loader `top-level property access`
  - [x] wait-on doesn't work properly
  - [x] Don't pull docker local images
  - [x] Remove support ts config file version
  - [x] MDX docsOnly: true
  - [x] Listen to exception before waitForReady
  - [x] 0.7.30 did not compile for us (Cannot find module '@storybook/builder-webpack4'). https://github.com/iTwin/iTwinUI-react
  - [x] Take a look on preview.tsx in react-ui, it isn't transpile
  - [x] Creevey update should update only failed images
  - [x] Teamcity reporter doesn't output failed test with maxRetries > 0
  - [ ] E2E tests outputs skip option with duplicated values
  - [ ] hot-reloading doesn't work with re-exported stories
  - [ ] Angular stop working with babel-loader
  - [ ] Creevey update doesn't work on source repo
  - [ ] NPM Ctrl+C doesn't exit creevey
  - [x] ~~Creevey addon ui don't work with storybook 5.3~~ (Drop Storybook 5.x in Creevey 0.8)
  - [ ] Make work extract without defining creevey as an addon
  - [x] Run creevey with Vite
- [x] Add docs addon and mdx stories for old storybooks in e2e tests
- [x] Add extract stories to e2e tests
- [x] Change viewport height to 786 in config
- [x] Save TeamCity config in repo
- [x] Gitlab browse report fix
- [x] Add Storybook 6.2 e2e tests
- [x] Start server early and wait for build
- [x] Setup TeamCity CI
- [x] Update CircleCI and GitLab according by github actions
- [x] Write config description instead of config example
- [x] Hide some advanced docs in other pages
- [x] update demo video
- [x] Rewrite description to more clear one
- [x] Add ABBYY logo
- [x] Rework github actions workflows
- [x] Add CI example in docs
- [x] Add Storybook integration tests
  - Init projects with various frameworks
  - Init storybook using storybook cli
  - Add creevey config
  - Test webpack building (include bundle size)
  - Test stories tests in output
- [x] Features
  - [x] Show multiple tests for browser in storybook UI
  - [x] Allow run multiple tests from storybook UI
  - [x] Add `waitForReady` parameter
  - [x] Allow to ignore elements in capturing screenshot
  - [x] Add link `go to runner` in addon UI
  - [x] Show side-by-side diff vertically or horizontally depends on aspect
  - [x] Add resolveStorybookUrl to config
  - [x] Support teamcity screenshots diff UI https://www.jetbrains.com/help/teamcity/including-third-party-reports-in-the-build-results.html
  - [x] Save webpack stats.json for debug
  - [x] Send list of available browsers from api
  - [x] Handle main.js for 6.x+, remove addons from it
  - [x] Add extract command for CLI
  - [x] Pass grep option for `update` command
  - [x] Extract stories.json as a part of build storybook
  - [ ] Update `data.js` right after tests finish even in `--ui`
  - [ ] Add fallback option, load tests from browser (hmr and tests are disabled in this case)
    - [ ] Send PR to Storybook to allow use HMR for stories
  - [ ] Allow run creevey against static-storybook folder (Depends on fallback tests loading)
  - [x] Implement first iteration of mdx support (support only stories without docs)
    - Move webpack/update to separate folder/file
  - [x] Mdx e2e tests
    - Add tests loader and e2e
- [x] Fix todos in browser.ts and `no-shadow` rule
- [x] Rename `webpack` to bundler. Move bundler.ts
- [x] Add debug output for webdriver build and resolve and story switch
- [ ] Improve and approve storybook.examples e2e tests
- [ ] Fix github actions for forked storybook repo
- [x] Be able to run storybook examples e2e in CI
- [x] Improve Docker
  - [x] Private docker images registry
  - [x] Allow use standalone binary instead of Docker image for browser (https://aerokube.com/selenoid/latest/#_standalone_binary)
- [ ] Docs
  - [ ] Example link
  - [ ] Add vue3 example
  - [ ] Add github actions for creevey-examples
  - [ ] Ignore elements
  - [ ] Describe use cases
    - MDX, animations, CI + docker, custom images (options), sauceLabs, standalone, waitForReady, extract, etc
    - use `/** @type {import("webpack").Configuration } */` thing for creevey.config
  - [ ] Rewrite config docs to more detail (simple setup, use cases, config description)
  - [ ] How to setup creevey report in TeamCity
  - [ ] Add new options (selenoidPath, webdriverCommand, etc)
  - [ ] Lazy-load components (use https://storybook.js.org/docs/react/writing-stories/loaders)
  - [ ] Add best practices for stories
    - Git LFS
    - Avoid write side-effects
    - Don't generate CSF dynamically
    - Do side-effect in separate files (examples)
- [ ] Demo Page
  - [ ] Expose official storybook page with creevey
  - [ ] Run creevey API somewhere in VPS
  - [ ] Support changing args (pass new args values to creevey server -> server sends them to browser in docker)
  - [ ] (Optional) On approve save args values for story
  - [ ] (Question) How handle multiple users? Github auth? Autoscale docker hosting
    - Limit session time 5-10 min then stop/remove docker container
    - Limit 1 session per IP, reuse same container
    - Start new instance by request from browser
    - Write nodejs proxy app, that starts creevey on random port
    - Use Google cloud k8s

## First priority (v0.8)

- [ ] Support es modules
- [ ] Expose new API for captureElement and ComponentStoryFn/Obj with creevey params
- [ ] Wrap creevey capture inside storybook instrumenter
  - [ ] Assert images on capture
- [ ] Check `storyStoreV7` feature
- [ ] Migrate to Vite
- [ ] Can't use play function in mdx
- [ ] Update don't work with docs? check
- [ ] Remove report on each start
- [ ] Bugs
  - [ ] Stories with restricted characters
  - [ ] Output error that can't find storybook dir or you forgot to add creevey as an addon
  - [ ] Fix taking composite screenshots with hidden scrollbar
    - Don't use scrollBarWidth or hasScrollBar helpers
    - Take `document.documentElement.clientWidth/Height` instead of window rect
    - For each screenshot after scroll, take elementRect coordinates
    - Iterate by screen images and calculate resulting x/y coordinates for composite image
    - If image width/height greater than viewport width/height then scroll bar is captured
  - [x] ~~Stop stdout from workers after shutdown event~~ (Issue with yarn: https://github.com/yarnpkg/yarn/issues/4667)
- [ ] Test with yarn2
- [ ] Think about how to test with ESM (try to use import() from esm directory)
- [ ] Try https://docs.gitlab.com/runner/executors/docker.html#the-privileged-mode
- [ ] Move docker config options to separate prop `docker`
- [ ] Move from yarn to npm@7
- [ ] Drop support nodejs 10
- [ ] Download webdriver binary automatically (see bigtest as example)
- [ ] Rename `screenDir` config option
- [ ] Drop storiesOf and Storybook v5.x support
  - [x] ~~Could we drop more entry points from webpack config? (generated entry for example)~~ (Nope)
- [x] ~~Fix png logos~~
- [x] Support GitLab CI (used services and standalone selenoid)
- [x] ~~Add edge cases for e2e tests~~ (Add on demand)
- [x] ~~Figure out if I need use my own react and setup this https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html or I need to use react from storybook~~ (Storybook uses optional react deps, so it's better to leave as-is)
- [x] ~~Support esm/cjs builds~~
- [x] ~~Research webpack 5~~ (Doesn't need after using babel for building)
- [x] ~~Bring all examples from storybook repo and test with creevey~~ (It's too expensive, e2e tests are pretty enough)
  - Save here images/configs/bundle/stories.json
  - Grab storybook examples from same version as installed here
- [x] ~~Annotate types for storybook 6.2~~ (It seems like was needed for webpack config builder)
- [ ] Features
  - [ ] CSFv3 + Interactors => PoC run tests in browser
    - [ ] Require support static storybook
    - [ ] Add config option to switch using play method
    - [ ] Check the story events story render and play finish
    - [ ] Can we catch play method errors?
    - [ ] Add `capture` command for Creevey websocket server
  - [ ] Create/Update stories directly from Storybook (by changing args)
    - [ ] Sync Args values with remote browsers
  - [ ] `update` should remove unnecessary images
  - [ ] Use native composite screenshots for browsers which support it
  - [ ] Get other storybook options, like babel configs from main.js
    - https://storybook.js.org/docs/react/configure/babel
  - [ ] Implement chromatic capture element resolving logic
    - If only one child inside `#root` node => capture `#root > *`
    - If more children => capture `#root`
    - Else capture viewport
  - [ ] Capture storybook docs pages (where should be defined creevey parameters?)
    - Listen event `Events.DOCS_RENDERED`
    - The root element is `#docs-root`
  - [ ] Support JUnit mocha reporter
  - [ ] Change `skip` option API (described somewhere in telegram, like object with keys or other format)
  - [ ] Move creevey config inside addon
    - Describe storybook config dir in args
    - How to deal with fallback option?
    - Load addons from storybook api
  - [ ] Try to use odiff tool (https://github.com/dmtrKovalenko/odiff)
  - [ ] Run extract command as part of storybook building process (Think about storybook built-in extract command)
    - [ ] Execute extract with custom bundlers
  - [ ] Support Storybook Composition https://storybook.js.org/docs/react/workflows/storybook-composition
  - [ ] Support `stories.svelte` https://storybook.js.org/blog/storybook-for-svelte/
    - https://github.com/storybookjs/addon-svelte-csf/blob/main/src/parser/svelte-stories-loader.ts
    - Write transformation to extract parameters from compiled svelte code
  - [x] ~~Webpack 5 support~~ (Doesn't need after using babel for building)
  - [x] ~~Allow defined params for knobs and args to capture story with different states~~ (Doesn't need with CSFv3)

## Second priority (v0.8.x)

- [ ] Add instruction for various frameworks
  - [ ] Web components
  - [ ] Create React App Typescript
  - [ ] Gatsby
  - [ ] Next.js
  - [ ] https://nx.dev/
- [ ] Bugs
  - [ ] SKB Kontur Selenium Grid resolve url timeout
  - [ ] IE don't work in github actions maybe out of sync?
  - [ ] IE fail because out of sync. Add explicit wait for each browser action
  - [ ] We need to define flag when story threw an error. Check flag in selenium and capture screenshot for debug
  - [ ] MDX imported stories missed source parameters in creevey (allow to import such stories)
  - [ ] ERR! Runtime error! Check your browser console. ERR! ResizeObserver loop limit exceeded (in addon)
  - [ ] Creevey nodejs console output `This browser doesn't support requestAnimationFrame.`
  - [ ] webpack config dll references (disable dll plugin)
  - [ ] Scrollbar is not visible on dark theme in ResultPage
  - [ ] Don't have hot reload on preview config storybook
- [ ] Check latest storybook docs on useful cases
- [ ] Add google analytics (send reports, versions, addons, framework, configs, package.json?)
- [ ] Test standalone selenoid + webdriver work
- [ ] Add more tests on different esnext features (test babel-parser + plugins)
- [ ] Add custom docker images with node+selenoid+browser (We won't need them, if we make creevey-as-a-service image)
- [ ] Features
  - [ ] Simplify work with monorepos https://github.com/adiun/vite-monorepo
  - [ ] Support other browser automation tools
    - [ ] Playwright
    - [ ] Puppeteer
  - [ ] Improve `waitForReady` for interaction tests
    - `await this.waitForReady(() => this.browser.sendKeys().perform())`
    - `await this.takeScreenshot()`
  - [ ] Stop gif animations (investigate)
  - [ ] Add status approved, apply after approve and reset after run
  - [ ] Output browser logs for debug
  - [ ] Support switch between globals https://github.com/wKich/creevey/discussions/108
  - [ ] Merge stories from nodejs bundle and browser, output warning to user if some stories are missing in nodejs
  - [ ] Add `HTML` diff view
  - [ ] Add option to apply custom styles to #root or something else
  - [ ] Improve creevey-addon webpack config to allow use `import { By } from 'selenium'` and maybe other stuff (add creevey-selenium or improve creevey-loader)
  - [ ] Wait for resources loaded (~~fonts~~, images, etc) How?
  - [ ] Allow set viewport sizes for story (use width x height as postfix for browser name in UI)
  - [ ] Add fuzzy search and highlight
  - [ ] Improve creevey-loader
    - [x] Support re-export stories
    - [ ] Don't warn user on imported tests
    - [ ] Check storiesOf/addDecorators/addParameters import from @storybook
    - [ ] Output warnings when somewhere is spread/rest is used
    - [ ] Remove unused side-effects from nested scopes
    - [x] Support exclude/include stories parameter
    - [ ] Correctly cutoff re-exported stories/parameters

## Third priority (v0.9)

- [ ] Rename `in` skip option to `browsers`
- [ ] Integrate effection https://github.com/thefrontside/effection
- [ ] Experiment with html2canvas
- [ ] Update Readme
  - [ ] How to deal with animations (CREEVEY_ENV)
- [ ] Add bootstrap script, that build and install current version into examples or use monorepo
- [ ] Transform to monorepo
  - [ ] creevey
  - [ ] chai-images
  - [ ] creevey-selenium
  - [ ] creevey-docker
  - [ ] creevey-storybook
  - [ ] examples
- [ ] Features
  - [ ] Add test editor inside the addon (user be able to write/change tests for story)
  - [ ] Allow save approved screenshots in separate storage, like S3
  - [ ] Add API to allow to use third party "stories" resolvers to support not only storybook
  - [ ] Allow to extend this.browser API
  - [ ] Try AWS Lambda (Think about Creevey-as-a-Service. Deploy Creevey server. And it could be used in gitlab as service)
  - [ ] Allow to select elements for capture from storybook UI
  - [ ] Allow to ignore elements or rects in storybook UI
  - [ ] Support docker-in-docker (start storybook and creevey inside docker)
    - [ ] Start storybook inside docker
    - [ ] Allow define custom storybook image
  - [ ] Improve CLI add grep/kind/story option
  - [ ] Setup CREEVEY_ENV (in project use `if (CREEVEY_ENV) {}` and addon define function that check if it inside creevey or not)
  - [ ] Allow pass components into `findElement`
    - The idea is, add some transformation to creevey-addon, and replace it component to `[data-comp-name~="MyComponent"]`
    - Then need to investigate how to inject such data-attributes to html node (especially for non-react frameworks)
  - [ ] Add `init` cli option
  - [ ] Easy way to ignore stories/kinds from UI
  - [ ] Allow to restart tests on story changes
  - [ ] Add `only` option as opposite for `skip`
  - [ ] Creevey-as-a-Service
- [ ] Improve Docker
  - [ ] Add vnc
  - [ ] Add video recording
- [ ] Bugs
  - [ ] Fix flex-shrink in side-by-side view not work with disabled cache

## Not in first time

- [ ] Correctly reload and reset tests statuses according source code file dependencies
- [ ] Improve css filter for blend view, try to reach pixelmatch output
- [ ] Profile tests loading process (maybe we don't need workers at all)
- [ ] Always save images even if test with matchImages failed
- [ ] Add liftoff https://github.com/js-cli/js-liftoff
- [ ] Tests on images view components with various scenarios (same/diff sizes, less/bigger viewport, elements with width/height not integer size)
- [ ] Bugs
  - [ ] Firefox double click if clicks in different tests
- [ ] Improve CLI
  - [ ] Output cli help
- [ ] Rework UI
  - [ ] Show removed tests results, mark these as removed
  - [ ] Allow hide skipped tests in UI
  - [ ] Allow switch between 1:1 and fit image views
- [ ] Add unit tests
- [ ] Rewrite to use `worker_threads` instead of `cluster` to allow use shared memory
- [ ] Support mocha options for workers
- [ ] Programmic API
- [ ] Add logger lib

## Maybe Never

- [ ] vscode mocha explorer
  - [ ] codelens run not work (need full path)
  - [ ] tests run with default timeout even if it changed in config
  - [ ] cwd and require conflict each other
  - [ ] mocha opts and mocha bin is not prefect support
- [ ] Use own runner instead of mocha
- [ ] Allow use creevey without storybook
- [ ] Support third-party test runners

## The new beginning

- [x] Use odiff
- [ ] Kontur creevey config
- [ ] Add similar to playwright tracing
- [ ] Show instructions for git-lfs
- [x] Replace mocha to manual runner (or another variant)
- [x] Remove chai and provide `expect` specially for images (maybe another API)
- [ ] Try pkgroll or use storybook addon-kit template
- [ ] Move some deps used in components to devDeps
- [ ] Use `birpc` for communication between workers
- [ ] Replace @storybook/core-events

- Add shortcuts for approve/view switch/image switch
