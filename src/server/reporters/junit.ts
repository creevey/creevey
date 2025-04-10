import EventEmitter from 'events';
import { dirname, resolve } from 'path';
import { closeSync, existsSync, mkdirSync, openSync, writeFileSync } from 'fs';
import { TEST_EVENTS, FakeTest } from '../../types.js';
import { logger } from '../logger.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class IndentedLogger<T = any> {
  private currentIndent = '';

  constructor(private baseLog: (text: string) => T) {}

  indent(): void {
    this.currentIndent += '    ';
  }

  unindent(): void {
    this.currentIndent = this.currentIndent.substring(0, this.currentIndent.length - 4);
  }

  log(text: string): T {
    return this.baseLog(this.currentIndent + text);
  }
}

// NOTE: This is a reworked copy of the JUnitReporter class from Vitest.
export class JUnitReporter {
  private reportFile: string;
  private fileFd?: number;
  private logger: IndentedLogger<void>;
  private suites: Record<string, FakeTest[]> = {};
  // TODO classnameTemplate
  constructor(runner: EventEmitter, options: { reportDir: string; reporterOptions: { outputFile?: string } }) {
    const { reportDir, reporterOptions } = options;

    this.reportFile = reporterOptions.outputFile ?? resolve(reportDir, 'junit.xml');

    this.logger = new IndentedLogger((text) => {
      this.fileFd ??= openSync(this.reportFile, 'w+');

      writeFileSync(this.fileFd, `${text}\n`);
    });

    runner.on(TEST_EVENTS.RUN_BEGIN, () => {
      this.suites = {};

      const outputDirectory = dirname(this.reportFile);
      if (!existsSync(outputDirectory)) {
        mkdirSync(outputDirectory, { recursive: true });
      }

      this.fileFd = openSync(this.reportFile, 'w+');
    });
    runner.on(TEST_EVENTS.TEST_PASS, (test: FakeTest) => {
      const suite = this.suites[test.parent.title] ?? [];
      suite.push(test);
    });
    runner.on(TEST_EVENTS.TEST_FAIL, (test: FakeTest) => {
      const suite = this.suites[test.parent.title] ?? [];
      suite.push(test);
    });
    runner.on(TEST_EVENTS.RUN_END, () => {
      this.onFinished();
    });
  }

  private writeElement(name: string, attrs: Record<string, string | number | undefined>, children?: () => void): void {
    const pairs: string[] = [];
    for (const key in attrs) {
      const attr = attrs[key];
      if (attr === undefined) {
        continue;
      }

      pairs.push(`${key}="${escapeXML(attr)}"`);
    }

    this.logger.log(`<${name}${pairs.length ? ` ${pairs.join(' ')}` : ''}>`);
    this.logger.indent();
    children?.call(this);
    this.logger.unindent();

    this.logger.log(`</${name}>`);
  }

  private writeTasks(tests: FakeTest[]): void {
    for (const test of tests) {
      const classname = test.parent.title;

      this.writeElement(
        'testcase',
        {
          classname,
          name: test.title,
          time: getDuration(test),
        },
        () => {
          if (test.state === 'failed') {
            const error = test.err;
            this.writeElement('failure', { message: error });
          }
        },
      );
    }
  }

  private onFinished(): void {
    this.logger.log('<?xml version="1.0" encoding="UTF-8" ?>');

    const suites = Object.entries(this.suites).map(([name, tests]) => {
      return {
        name,
        tests,
        failures: tests.filter((test) => test.state === 'failed').length,
        time: tests.reduce((acc, test) => acc + (test.duration ?? 0), 0),
      };
    });
    const stats = suites.reduce(
      (s, { tests, failures, time }) => {
        s.tests += tests.length;
        s.failures += failures;
        s.time += time;
        return s;
      },
      { name: 'creevey tests', tests: 0, failures: 0, time: 0 },
    );

    this.writeElement('testsuites', { ...stats, time: executionTime(stats.time) }, () => {
      suites.forEach(({ name, tests, failures, time }) => {
        this.writeElement(
          'testsuite',
          {
            name,
            tests: tests.length,
            failures,
            time: executionTime(time),
          },
          () => {
            this.writeTasks(tests);
          },
        );
      });
    });

    if (this.reportFile) {
      logger().info(`JUNIT report written to ${this.reportFile}`);
    }

    if (this.fileFd) {
      closeSync(this.fileFd);
      this.fileFd = undefined;
    }
  }
}

// https://gist.github.com/john-doherty/b9195065884cdbfd2017a4756e6409cc
function removeInvalidXMLCharacters(value: string, removeDiscouragedChars: boolean): string {
  let regex =
    // eslint-disable-next-line no-control-regex
    /([\0-\x08\v\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;
  value = String(value).replace(regex, '');

  if (removeDiscouragedChars) {
    // remove everything discouraged by XML 1.0 specifications
    regex = new RegExp(
      '([\\x7F-\\x84]|[\\x86-\\x9F]|[\\uFDD0-\\uFDEF]|\\uD83F[\\uDFFE\\uDFFF]|(?:\\uD87F[\\uDF' +
        'FE\\uDFFF])|\\uD8BF[\\uDFFE\\uDFFF]|\\uD8FF[\\uDFFE\\uDFFF]|(?:\\uD93F[\\uDFFE\\uD' +
        'FFF])|\\uD97F[\\uDFFE\\uDFFF]|\\uD9BF[\\uDFFE\\uDFFF]|\\uD9FF[\\uDFFE\\uDFFF]' +
        '|\\uDA3F[\\uDFFE\\uDFFF]|\\uDA7F[\\uDFFE\\uDFFF]|\\uDABF[\\uDFFE\\uDFFF]|(?:\\' +
        'uDAFF[\\uDFFE\\uDFFF])|\\uDB3F[\\uDFFE\\uDFFF]|\\uDB7F[\\uDFFE\\uDFFF]|(?:\\uDBBF' +
        '[\\uDFFE\\uDFFF])|\\uDBFF[\\uDFFE\\uDFFF](?:[\\0-\\t\\v\\f\\x0E-\\u2027\\u202A-\\uD7FF\\' +
        'uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|' +
        '(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF]))',
      'g',
    );

    value = value.replace(regex, '');
  }

  return value;
}

function escapeXML(value: string | number): string {
  return removeInvalidXMLCharacters(
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;'),
    true,
  );
}

function executionTime(durationMS: number) {
  return (durationMS / 1000).toLocaleString('en-US', {
    useGrouping: false,
    maximumFractionDigits: 10,
  });
}

function getDuration(task: FakeTest): string | undefined {
  const duration = task.duration ?? 0;
  return executionTime(duration);
}
