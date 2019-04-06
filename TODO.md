## TODO

- [x] Test types
- [x] Add binary
- [x] Subscribe on workers ready
- [ ] Web interface
  - [ ] webpack build
  - [ ] usage react-ui
  - [ ] output tests tree
  - [ ] allow start/stop
  - [ ] output test status
  - [ ] output reported images
    - [ ] like github does
    - [ ] switch by hotkeys
  - [ ] approve images
- [ ] Save images report in multiple runs
- [ ] Add cli arguments
  - [x] config
  - [ ] grep/kind/story
- [ ] Add test parser
- [ ] Custom reporter
- [ ] Allow to use Teamcity reporter
- [x] Mocha workers for server
- [ ] Fail if try run test with incorrect id
- [x] Build correct `d.ts` files. For now, you should remove require types from `lib/creevey.js` after build.
- [x] Pass `config` to server initialization (use process.cwd())
- [x] Single fork for single browser thread
- [ ] Reset mouse position
- [ ] Add react-selenium-testing
- [ ] Add unit tests
- [x] Parallel (need prebuild? worker-farm?)
  - [x] Custom server runner
  - [x] Patch mocha runner with cluster
- [x] Allow customize hooks to non-storybook env
- [x] Defined default config + deep merge
- [ ] Add storybook addon (add `All stories` story and `renderStory` global func)
- [ ] Typescript config
  - [ ] Better handle config/defaultConfig types
- [ ] Simplify types re-export for lib usage
- [ ] vscode mocha explorer
  - [ ] codelens run not work (need full path)
  - [ ] tests run with default timeout even if it changed in config
  - [ ] cwd and require conflict each other
  - [ ] mocha opts and mocha bin is not prefect support
- [ ] Support mocha options for workers
- [ ] Support load test files from glob patterns
- [ ] Separate class for Worker
- [ ] Storybook fow web ui
- [ ] is uuid needed?

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
