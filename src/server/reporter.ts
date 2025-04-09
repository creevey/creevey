import chalk from 'chalk';
import Logger from 'loglevel';
import prefix from 'loglevel-plugin-prefix';
import { FakeTest, Images, isDefined, isImageError, TEST_EVENTS } from '../types.js';
import EventEmitter from 'events';

const testLevels: Record<string, string> = {
  INFO: chalk.green('PASS'),
  WARN: chalk.yellow('START'),
  ERROR: chalk.red('FAIL'),
};

export class CreeveyReporter {
  private logger: Logger.Logger | null = null;
  // TODO Output in better way, like vitest, maybe
  constructor(runner: EventEmitter) {
    runner.on(TEST_EVENTS.TEST_BEGIN, (test: FakeTest) => {
      this.getLogger(test.creevey).warn(chalk.cyan(test.fullTitle()));
    });
    runner.on(TEST_EVENTS.TEST_PASS, (test: FakeTest) => {
      this.getLogger(test.creevey).info(chalk.cyan(test.fullTitle()), chalk.gray(`(${test.duration} ms)`));
    });
    runner.on(TEST_EVENTS.TEST_FAIL, (test: FakeTest, error) => {
      this.getLogger(test.creevey).error(
        chalk.cyan(test.fullTitle()),
        chalk.gray(`(${test.duration} ms)`),
        '\n  ',
        this.getErrors(
          error,
          (error, imageName) => `${chalk.bold(imageName ?? test.creevey.browserName)}:${error}`,
          (error) => error.stack ?? error.message,
        ).join('\n  '),
      );
    });
  }

  private getLogger(options: { sessionId: string; browserName: string }) {
    if (this.logger) return this.logger;
    const { sessionId, browserName } = options;
    const testLogger = Logger.getLogger(sessionId);

    this.logger = prefix.apply(testLogger, {
      format(level) {
        return `[${browserName}:${chalk.gray(process.pid)}] ${testLevels[level]} => ${chalk.gray(sessionId)}`;
      },
    });

    return this.logger;
  }

  private getErrors(
    error: unknown,
    imageErrorToString: (error: string, imageName?: string) => string,
    errorToString: (error: Error) => string,
  ): string[] {
    const errors = [];
    if (!(error instanceof Error)) {
      errors.push(error as string);
    } else if (!isImageError(error)) {
      errors.push(errorToString(error));
    } else if (typeof error.images == 'string') {
      errors.push(imageErrorToString(error.images));
    } else {
      const imageErrors = error.images ?? {};
      Object.keys(imageErrors).forEach((imageName) => {
        errors.push(imageErrorToString(imageErrors[imageName] ?? '', imageName));
      });
    }
    return errors;
  }
}

export class TeamcityReporter {
  constructor(runner: EventEmitter) {
    runner.on(TEST_EVENTS.TEST_BEGIN, (test: FakeTest) => {
      console.log(`##teamcity[testStarted name='${this.escape(test.fullTitle())}' flowId='${process.pid}']`);
    });

    runner.on(TEST_EVENTS.TEST_PASS, (test: FakeTest) => {
      console.log(`##teamcity[testFinished name='${this.escape(test.fullTitle())}' flowId='${process.pid}']`);
    });

    runner.on(TEST_EVENTS.TEST_FAIL, (test: FakeTest, error: Error) => {
      const browserName = this.escape(test.creevey.browserName);
      Object.entries(test.creevey.images).forEach(([name, image]) => {
        if (!image) return;
        const filePath = test
          .titlePath()
          .slice(0, -1)
          .concat(name == browserName ? [] : [browserName])
          .map(this.escape)
          .join('/');

        const { error: _, ...rest } = image;
        Object.values(rest as Partial<Images>)
          .filter(isDefined)
          .forEach((fileName) => {
            console.log(
              `##teamcity[publishArtifacts '${test.creevey.reportDir}/${filePath}/${fileName} => report/${filePath}']`,
            );
            console.log(
              `##teamcity[testMetadata testName='${this.escape(
                test.fullTitle(),
              )}' type='image' value='report/${filePath}/${fileName}' flowId='${process.pid}']`,
            );
          });
      });

      // Output failed test as passed due TC don't support retry mechanic
      // https://teamcity-support.jetbrains.com/hc/en-us/community/posts/207216829-Count-test-as-successful-if-at-least-one-try-is-successful?page=1#community_comment_207394125

      if (test.creevey.willRetry)
        console.log(`##teamcity[testFinished name='${this.escape(test.fullTitle())}' flowId='${process.pid}']`);
      else
        console.log(
          `##teamcity[testFailed name='${this.escape(test.fullTitle())}' message='${this.escape(
            error.message,
          )}' details='${this.escape(error.stack ?? '')}' flowId='${process.pid}']`,
        );
    });
  }

  private escape = (str: string): string => {
    if (!str) return '';
    return (
      str
        .toString()
        // eslint-disable-next-line no-control-regex
        .replace(/\x1B.*?m/g, '')
        .replace(/\|/g, '||')
        .replace(/\n/g, '|n')
        .replace(/\r/g, '|r')
        .replace(/\[/g, '|[')
        .replace(/\]/g, '|]')
        .replace(/\u0085/g, '|x')
        .replace(/\u2028/g, '|l')
        .replace(/\u2029/g, '|p')
        .replace(/'/g, "|'")
    );
  };
}
