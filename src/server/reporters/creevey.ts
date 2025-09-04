import chalk from 'chalk';
import Logger from 'loglevel';
import prefix from 'loglevel-plugin-prefix';
import { FakeTest, isImageError, TEST_EVENTS } from '../../types.js';
import EventEmitter from 'events';

const testLevels: Record<string, string> = {
  INFO: chalk.green('PASS'),
  WARN: chalk.yellow('START'),
  ERROR: chalk.red('FAIL'),
};

let browserName = '';
let sessionId = '';
let processId = process.pid;

export class CreeveyReporter {
  private logger: Logger.Logger | null = null;
  // TODO Output in better way, like vitest, maybe
  constructor(runner: EventEmitter) {
    runner.on(TEST_EVENTS.TEST_BEGIN, (test: FakeTest) => {
      this.getLogger(test.creevey).warn(chalk.cyan(test.fullTitle()));
    });
    runner.on(TEST_EVENTS.TEST_PASS, (test: FakeTest) => {
      this.getLogger(test.creevey).info(
        chalk.cyan(test.fullTitle()),
        test.duration ? chalk.gray(`(${test.duration} ms)`) : '',
      );
    });
    runner.on(TEST_EVENTS.TEST_FAIL, (test: FakeTest, error) => {
      this.getLogger(test.creevey).error(
        chalk.cyan(test.fullTitle()),
        test.duration ? chalk.gray(`(${test.duration} ms)`) : '',
        '\n  ',
        this.getErrors(
          error,
          (error, imageName) => `${chalk.bold(imageName ?? test.creevey.browserName)}:${error}`,
          (error) => error.stack ?? error.message,
        ).join('\n  '),
      );
    });
  }

  private getLogger(options: { sessionId: string; browserName: string; workerId: number }) {
    ({ sessionId, browserName, workerId: processId = process.pid } = options);

    if (this.logger) return this.logger;

    const testLogger = Logger.getLogger(sessionId);

    this.logger = prefix.apply(testLogger, {
      format(level) {
        return `[${browserName}:${chalk.gray(processId)}] ${testLevels[level]} => ${chalk.gray(sessionId)}`;
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
