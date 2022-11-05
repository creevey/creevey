import chalk from 'chalk';
import { Runner, reporters, MochaOptions } from 'mocha';
import prefix from 'loglevel-plugin-prefix';
import { Images, isDefined, isImageError } from '../../types.js';
import { getLogger } from '../logger.js';

interface ReporterOptions {
  reportDir: string;
  sessionId: string;
  topLevelSuite: string;
  willRetry: boolean;
  images: Partial<{
    [name: string]: Partial<Images>;
  }>;
}

const testLevels: { [level: string]: string } = {
  INFO: chalk.green('PASS'),
  WARN: chalk.yellow('START'),
  ERROR: chalk.red('FAIL'),
};

export class CreeveyReporter extends reporters.Base {
  constructor(runner: Runner, options: MochaOptions) {
    super(runner);

    const { sessionId, topLevelSuite } = options.reporterOptions as ReporterOptions;
    const testLogger = getLogger(topLevelSuite);

    prefix.apply(testLogger, {
      format(level) {
        return `${testLevels[level]} => (${topLevelSuite}:${chalk.gray(sessionId)})`;
      },
    });

    runner.on('test', (test) => testLogger.warn(chalk.cyan(test.titlePath().join('/'))));
    runner.on('pass', (test) => testLogger.info(chalk.cyan(test.titlePath().join('/'))));
    runner.on('fail', (test, error) =>
      testLogger.error(
        chalk.cyan(test.titlePath().join('/')),
        '\n  ',
        getErrors(
          error,
          (error, imageName) => `${chalk.bold(imageName ?? topLevelSuite)}:${error}`,
          (error) => `${error.stack ?? error.message}`,
        ).join('\n  '),
      ),
    );
  }
}

export class TeamcityReporter extends reporters.Base {
  constructor(runner: Runner, options: MochaOptions) {
    super(runner);

    const topLevelSuite = this.escape((options.reporterOptions as ReporterOptions).topLevelSuite);
    const reporterOptions = options.reporterOptions as ReporterOptions;

    runner.on('suite', (suite) =>
      suite.root
        ? console.log(`##teamcity[testSuiteStarted name='${topLevelSuite}' flowId='${process.pid}']`)
        : console.log(`##teamcity[testSuiteStarted name='${this.escape(suite.title)}' flowId='${process.pid}']`),
    );

    runner.on('test', (test) =>
      console.log(`##teamcity[testStarted name='${this.escape(test.title)}' flowId='${process.pid}']`),
    );

    runner.on('fail', (test, error: Error) => {
      Object.entries(reporterOptions.images).forEach(([name, image]) => {
        if (!image) return;
        const filePath = test
          .titlePath()
          .concat(name == topLevelSuite ? [] : [topLevelSuite])
          .map(this.escape)
          .join('/');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { error, ...rest } = image;
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

      reporterOptions.willRetry
        ? console.log(`##teamcity[testFinished name='${this.escape(test.title)}' flowId='${process.pid}']`)
        : console.log(
            `##teamcity[testFailed name='${this.escape(test.title)}' message='${this.escape(
              error.message,
            )}' details='${this.escape(error.stack ?? '')}' flowId='${process.pid}']`,
          );
    });

    runner.on('pending', (test) =>
      console.log(
        `##teamcity[testIgnored name='${this.escape(test.title)}' message='${this.escape(
          typeof test.skipReason == 'boolean' ? test.title : test.skipReason,
        )}' flowId='${process.pid}']`,
      ),
    );

    runner.on('test end', (test) =>
      console.log(`##teamcity[testFinished name='${this.escape(test.title)}' flowId='${process.pid}']`),
    );

    runner.on(
      'suite end',
      (suite) =>
        suite.root ||
        console.log(`##teamcity[testSuiteFinished name='${this.escape(suite.title)}' flowId='${process.pid}']`),
    );

    runner.on('end', () =>
      console.log(`##teamcity[testSuiteFinished name='${topLevelSuite}' flowId='${process.pid}']`),
    );
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

function getErrors(
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
    const imageErrors = error.images;
    Object.keys(imageErrors).forEach((imageName) => {
      errors.push(imageErrorToString(imageErrors[imageName] ?? '', imageName));
    });
  }

  return errors;
}
