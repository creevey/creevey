## TODO

- Test work ui and server
- Test types
- Add binary
- Fail if try run test with incorrect id
- Build correct `d.ts` files. For now, you should remove require types from `lib/creevey.js` after build.
- Pass `config` to server initialization (use process.cwd())
- Add `worker-farm` to start mocha threads by browser (fork with options)
- Single fork for single browser
- Another mocha UI
- Reset mouse position
- Add react-selenium-testing
- Tests for interface
- Parallel (need prebuild? worker-farm?)
- Customize hooks to non-storybook env

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
