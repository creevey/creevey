import { Runner, reporters, MochaOptions } from "mocha";

export default class Reporter extends reporters.Base {
  constructor(runner: Runner, options: MochaOptions) {
    super(runner);
    // TODO chalk

    runner.on("test", test =>
      console.log(`[START:${process.pid}]`, `${options.reporterOptions.topLevelSuite}/${test.titlePath().join("/")}`)
    );
    runner.on("pass", test =>
      console.log(`[PASS:${process.pid}]`, `${options.reporterOptions.topLevelSuite}/${test.titlePath().join("/")}`)
    );
    runner.on("fail", (test, error) =>
      console.log(
        `[FAIL:${process.pid}]`,
        `${options.reporterOptions.topLevelSuite}/${test.titlePath().join("/")}`,
        error.message
      )
    );
  }
}
