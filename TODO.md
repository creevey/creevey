## TODO

- [x] Test types
- [x] Add binary
- [ ] Mocha workers for server
- [ ] Fail if try run test with incorrect id
- [x] Build correct `d.ts` files. For now, you should remove require types from `lib/creevey.js` after build.
- [x] Pass `config` to server initialization (use process.cwd())
- [x] Single fork for single browser thread
- [ ] Another mocha UI
- [ ] Reset mouse position
- [ ] Add react-selenium-testing
- [ ] Tests for interface
- [ ] Parallel (need prebuild? worker-farm?)
  - [x] Custom server runner
  - [ ] Patch mocha runner with cluster
- [x] Allow customize hooks to non-storybook env
- [ ] Defined default config + deep merge
- [ ] Add storybook addon (add `All stories` story and `renderStory` global func)
- [ ] Typescript config
- [ ] Simplify types re-export
- [ ] vscode mocha explorer
  - [ ] codelens run not work (need full path)
  - [ ] tests run with default timeout even if it changed in config
  - [ ] cwd and require conflict each other
  - [ ] mocha opts and mocha bin is not prefect support
- [ ] Support mocha options for workers

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