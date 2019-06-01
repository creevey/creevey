## TODO

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
- [ ] Allow define sets (test files, address, browsers)
  - [ ] Filter tests by suites in parser
  - [ ] Merge common config with browser config
- [x] Not graceful exit master process on error in workers
- [x] Add worker timeout and restart it
- [x] ~~Ignore elements from screenshot~~
- [ ] Web interface
  - [x] webpack build
  - [x] usage react-ui
  - [x] output tests tree
  - [x] allow start/stop
  - [x] comm with API by test id
  - [ ] output test status (pending)
    - [ ] update/recalc status
  - [x] output reported images
    - [ ] like github does
    - [ ] switch by hotkeys
  - [x] approve images
  - [ ] output skipped tests
  - [ ] use classnames
  - [x] Offile mode, load report data
  - [x] Output test error message
  - [ ] ApprovedRetry
- [x] Generate static page in report dir
- [x] Save/Load results in/from report dir (js/json)
- [x] Save images report in multiple runs
- [ ] Handle error on mocha hooks
- [ ] Add cli arguments
  - [x] config
  - [x] parser
  - [x] ui
  - [ ] grep/kind/story
  - [ ] update
  - [x] reporter
- [ ] Update args readme (config, parser, ...)
- [x] Custom mocha reporter for worker
- [x] Allow to use Teamcity reporter
- [ ] Add storybook addon (add `All stories` story and `renderStory` global func)
  - [ ] Update to Storybook@5.x
  - [ ] Reset mouse position
- [ ] Support mocha options for workers
- [ ] Add unit tests
- [ ] Better handle websocket messages
- [x] Add worker ready event
- [x] Support load test files from glob patterns
- [ ] Allow define mocha hooks
- [ ] Simplify types re-export for lib usage
- [ ] Allow assert multiple images in one test
- [ ] vscode mocha explorer
  - [ ] codelens run not work (need full path)
  - [ ] tests run with default timeout even if it changed in config
  - [ ] cwd and require conflict each other
  - [ ] mocha opts and mocha bin is not prefect support
- [ ] Add Storybook for web ui components
- [ ] Status runner
- [ ] Add logger lib
- [ ] Config npmignore files
- [ ] Programmic API

## Runtime function

```ts
// NOTE This need parallel tests
export function describeBrowser(browserName: string) {
  const testContext: string[] = [];

  chai.use(chaiImage(testContext));

  describe(browserName, function() {
    before(async function() {
      this.browser = await getBrowser(config, config.browsers[browserName]);
    });

    beforeEach(async function() {
      await switchStory.call(this, testContext);
    });

    require("path/to/test.ts");
  });
}
```
