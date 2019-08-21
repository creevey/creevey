import chalk from "chalk";
import { Runner, reporters, MochaOptions } from "mocha";
import { Images, isDefined } from "../../types";

export class CreeveyReporter extends reporters.Base {
  constructor(runner: Runner, options: MochaOptions) {
    super(runner);

    const topLevelSuite = options.reporterOptions.topLevelSuite;

    runner.on("test", test =>
      console.log(`[${chalk.yellow("START")}:${topLevelSuite}:${process.pid}]`, chalk.cyan(test.titlePath().join("/")))
    );
    runner.on("pass", test =>
      console.log(`[${chalk.green("PASS")}:${topLevelSuite}:${process.pid}]`, chalk.cyan(test.titlePath().join("/")))
    );
    runner.on("fail", (test, error) =>
      console.log(
        `[${chalk.red("FAIL")}:${topLevelSuite}:${process.pid}]`,
        chalk.cyan(test.titlePath().join("/")),
        error.message
      )
    );
  }
}

export class TeamcityReporter extends reporters.Base {
  constructor(runner: Runner, options: MochaOptions) {
    super(runner);

    const topLevelSuite = this.escape(options.reporterOptions.topLevelSuite);
    const { willRetry, images } = options.reporterOptions as {
      willRetry: () => boolean;
      images: () => Partial<{
        [name: string]: Partial<Images>;
      }>;
    };

    // runner.on("suite", suite =>
    //   suite.root
    //     ? console.log(`##teamcity[testSuiteStarted name='${topLevelSuite}' flowId='${process.pid}']`)
    //     : console.log(`##teamcity[testSuiteStarted name='${this.escape(suite.title)}' flowId='${process.pid}']`)
    // );

    runner.on("test", test =>
      console.log(
        `##teamcity[testStarted name='${this.formatTitle(topLevelSuite, test.titlePath())}' flowId='${process.pid}']`
      )
    );

    runner.on("fail", (test, error) => {
      Object.values(images()).forEach(image => {
        if (!image) return;
        Object.values(image)
          .filter(isDefined)
          .forEach(imageName =>
            console.log(
              `##teamcity[testMetadata testName='${this.formatTitle(
                topLevelSuite,
                test.titlePath()
              )}' type='image' value='report.zip!/${test
                .titlePath()
                .map(this.escape)
                .join("/")}/${topLevelSuite}/${imageName}' flowId='${process.pid}']`
            )
          );
      });

      // Output failed test as passed due TC don't support retry mechanic
      // https://teamcity-support.jetbrains.com/hc/en-us/community/posts/207216829-Count-test-as-successful-if-at-least-one-try-is-successful?page=1#community_comment_207394125
      willRetry()
        ? console.log(
            `##teamcity[testFinished name='${this.formatTitle(topLevelSuite, test.titlePath())}' flowId='${
              process.pid
            }']`
          )
        : console.log(
            `##teamcity[testFailed name='${this.formatTitle(topLevelSuite, test.titlePath())}' message='${this.escape(
              error.message
            )}' details='${this.escape(error.stack)}' flowId='${process.pid}']`
          );
    });

    // runner.on("pending", test =>
    //   console.log(
    //     `##teamcity[testIgnored name='${this.escape(test.title)}' message='${this.escape(test.title)}' flowId='${
    //       process.pid
    //     }']`
    //   )
    // );

    runner.on("test end", test =>
      console.log(
        `##teamcity[testFinished name='${this.formatTitle(topLevelSuite, test.titlePath())}' flowId='${process.pid}']`
      )
    );

    // runner.on(
    //   "suite end",
    //   suite =>
    //     suite.root ||
    //     console.log(`##teamcity[testSuiteFinished name='${this.escape(suite.title)}' flowId='${process.pid}']`)
    // );

    // runner.on("end", () =>
    //   console.log(`##teamcity[testSuiteFinished name='${topLevelSuite}' flowId='${process.pid}']`)
    // );
  }

  private formatTitle(topLevelSuite: string, titlePath: string[]) {
    return `${topLevelSuite}.${titlePath.map(this.escape).join(".")}`;
  }

  private escape(str: string) {
    if (!str) return "";
    return str
      .toString()
      .replace(/\x1B.*?m/g, "")
      .replace(/\|/g, "||")
      .replace(/\n/g, "|n")
      .replace(/\r/g, "|r")
      .replace(/\[/g, "|[")
      .replace(/\]/g, "|]")
      .replace(/\u0085/g, "|x")
      .replace(/\u2028/g, "|l")
      .replace(/\u2029/g, "|p")
      .replace(/'/g, "|'");
  }
}
