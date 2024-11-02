import chalk from 'chalk';
import Logger from 'loglevel';
import prefix from 'loglevel-plugin-prefix';
import { FakeTest, Images, isDefined, isImageError, TEST_EVENTS } from '../types.js';
import EventEmitter from 'events';

interface ReporterOptions {
  reportDir: string;
  sessionId: string;
  browserName: string;
  willRetry: boolean;
  images: Partial<Record<string, Partial<Images>>>;
}

const testLevels: Record<string, string> = {
  INFO: chalk.green('PASS'),
  WARN: chalk.yellow('START'),
  ERROR: chalk.red('FAIL'),
};

export class CreeveyReporter {
  // TODO Output in better way, like vitest, maybe
  constructor(runner: EventEmitter, options: { reporterOptions: { creevey: ReporterOptions } }) {
    const { sessionId, browserName } = options.reporterOptions.creevey;
    const testLogger = Logger.getLogger(browserName);

    prefix.apply(testLogger, {
      format(level) {
        return `[${browserName}:${chalk.gray(process.pid)}] ${testLevels[level]} => ${chalk.gray(sessionId)}`;
      },
    });

    runner.on(TEST_EVENTS.TEST_BEGIN, (test: FakeTest) => {
      testLogger.warn(chalk.cyan(test.titlePath().join('/')));
    });
    runner.on(TEST_EVENTS.TEST_PASS, (test: FakeTest) => {
      testLogger.info(chalk.cyan(test.titlePath().join('/')));
    });
    runner.on(TEST_EVENTS.TEST_FAIL, (test: FakeTest, error) => {
      testLogger.error(
        chalk.cyan(test.titlePath().join('/')),
        '\n  ',
        this.getErrors(
          error,
          (error, imageName) => `${chalk.bold(imageName ?? browserName)}:${error}`,
          (error) => error.stack ?? error.message,
        ).join('\n  '),
      );
    });
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
  constructor(runner: EventEmitter, options: { reporterOptions: { creevey: ReporterOptions } }) {
    const browserName = this.escape(options.reporterOptions.creevey.browserName);
    const reporterOptions = options.reporterOptions.creevey;

    runner.on(TEST_EVENTS.TEST_BEGIN, (test: FakeTest) => {
      console.log(`##teamcity[testStarted name='${this.escape(test.title)}' flowId='${process.pid}']`);
    });

    runner.on(TEST_EVENTS.TEST_FAIL, (test: FakeTest, error: Error) => {
      Object.entries(reporterOptions.images).forEach(([name, image]) => {
        if (!image) return;
        const filePath = test
          .titlePath()
          .concat(name == browserName ? [] : [browserName])
          .map(this.escape)
          .join('/');

        const { error: _, ...rest } = image;
        Object.values(rest as Partial<Images>)
          .filter(isDefined)
          .forEach((fileName) => {
            console.log(
              `##teamcity[publishArtifacts '${reporterOptions.reportDir}/${filePath}/${fileName} => report/${filePath}']`,
            );
            console.log(
              `##teamcity[testMetadata testName='${this.escape(
                test.title,
              )}' type='image' value='report/${filePath}/${fileName}' flowId='${process.pid}']`,
            );
          });
      });

      // Output failed test as passed due TC don't support retry mechanic
      // https://teamcity-support.jetbrains.com/hc/en-us/community/posts/207216829-Count-test-as-successful-if-at-least-one-try-is-successful?page=1#community_comment_207394125

      if (reporterOptions.willRetry)
        console.log(`##teamcity[testFinished name='${this.escape(test.title)}' flowId='${process.pid}']`);
      else
        console.log(
          `##teamcity[testFailed name='${this.escape(test.title)}' message='${this.escape(
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
