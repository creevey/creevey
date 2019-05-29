import { Runner, reporters, MochaOptions } from "mocha";

export default class Reporter extends reporters.Base {
  constructor(runner: Runner, options: MochaOptions) {
    super(runner);
    // TODO chalk

    runner.on("pass", test =>
      console.log("[PASS]", `${test.titlePath().join("/")}/${options.reporterOptions.topLevelSuite}`)
    );
    runner.on("fail", (test, error) =>
      console.log("[FAIL]", `${test.titlePath().join("/")}/${options.reporterOptions.topLevelSuite}`, error.message)
    );
  }
}
