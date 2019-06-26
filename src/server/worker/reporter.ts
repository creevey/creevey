import chalk from "chalk";
import { Runner, reporters, MochaOptions } from "mocha";

export default class Reporter extends reporters.Base {
  constructor(runner: Runner, options: MochaOptions) {
    super(runner);

    runner.on("test", test =>
      console.log(
        `[${chalk.yellow("START")}:${options.reporterOptions.topLevelSuite}:${process.pid}]`,
        chalk.cyan(test.titlePath().join("/"))
      )
    );
    runner.on("pass", test =>
      console.log(
        `[${chalk.green("PASS")}:${options.reporterOptions.topLevelSuite}:${process.pid}]`,
        chalk.cyan(test.titlePath().join("/"))
      )
    );
    runner.on("fail", (test, error) =>
      console.log(
        `[${chalk.red("FAIL")}:${options.reporterOptions.topLevelSuite}:${process.pid}]`,
        chalk.cyan(test.titlePath().join("/")),
        error.message
      )
    );
  }
}
