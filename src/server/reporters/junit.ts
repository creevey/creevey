import EventEmitter from 'events';
import { dirname, relative, resolve } from 'path';
import { closeSync, existsSync, mkdirSync, openSync, writeFileSync } from 'fs';
import os from 'os';
import { TEST_EVENTS, FakeTest } from '../../types.js';
import { logger } from '../logger.js';
import { CreeveyReporter } from './creevey.js';

interface SuiteEntry {
  suiteName: string;
  browserName: string;
  tests: Map<string, FakeTest>;
}

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
  // @ts-expect-error Ignore unused
  private creeveyReporter: CreeveyReporter;
  private suites: Record<string, SuiteEntry> = {};
  private runStartTime: Date = new Date();
  private suiteStartTimes: Record<string, Date> = {};
  // TODO classnameTemplate
  // TODO Output console logs
  constructor(runner: EventEmitter, options: { reportDir: string; reporterOptions: { outputFile?: string } }) {
    const { reportDir, reporterOptions } = options;

    this.reportFile = reporterOptions.outputFile ?? resolve(reportDir, 'junit.xml');

    this.logger = new IndentedLogger((text) => {
      this.fileFd ??= openSync(this.reportFile, 'w+');

      writeFileSync(this.fileFd, `${text}\n`);
    });

    this.creeveyReporter = new CreeveyReporter(runner);

    runner.on(TEST_EVENTS.RUN_BEGIN, () => {
      this.suites = {};
      this.runStartTime = new Date();
      this.suiteStartTimes = {};

      const outputDirectory = dirname(this.reportFile);
      if (!existsSync(outputDirectory)) {
        mkdirSync(outputDirectory, { recursive: true });
      }

      this.fileFd = openSync(this.reportFile, 'w+');
    });
    runner.on(TEST_EVENTS.TEST_BEGIN, (test: FakeTest) => {
      this.suiteStartTimes[this.suiteKey(test)] ??= new Date();
    });
    runner.on(TEST_EVENTS.TEST_PASS, (test: FakeTest) => {
      this.getOrCreateSuite(test).tests.set(test.creevey.testId, test);
    });
    runner.on(TEST_EVENTS.TEST_FAIL, (test: FakeTest) => {
      this.getOrCreateSuite(test).tests.set(test.creevey.testId, test);
    });
    runner.on(TEST_EVENTS.RUN_END, () => {
      this.onFinished();
    });
  }

  private suiteKey(test: FakeTest): string {
    return `${test.parent.title}\0${test.creevey.browserName}`;
  }

  private getOrCreateSuite(test: FakeTest): SuiteEntry {
    const key = this.suiteKey(test);
    this.suites[key] ??= { suiteName: test.parent.title, browserName: test.creevey.browserName, tests: new Map() };
    return this.suites[key];
  }

  private isImageMismatch(test: FakeTest): boolean {
    return Object.values(test.creevey.images).some((img) => img !== undefined);
  }

  private writeElement(
    name: string,
    attrs: Record<string, string | number | undefined>,
    children?: () => void,
    textContent?: string,
  ): void {
    if (children !== undefined && textContent !== undefined) {
      throw new Error('writeElement: pass either children or textContent, not both');
    }

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
    if (textContent !== undefined) {
      for (const line of escapeXML(textContent).split('\n')) {
        this.logger.log(line);
      }
    } else {
      children?.call(this);
    }
    this.logger.unindent();

    this.logger.log(`</${name}>`);
  }

  private writeTasks(tests: Map<string, FakeTest>): void {
    for (const [, test] of tests) {
      const classname = test.parent.title;
      const attachments = test.attachments ?? [];
      this.writeElement(
        'testcase',
        {
          classname,
          name: test.title,
          time: getDuration(test),
        },
        () => {
          if (test.state === 'failed') {
            this.writeFailureOrError(test);
          }
          if (attachments.length > 0) {
            this.writeElement('properties', {}, () => {
              for (const absPath of attachments) {
                this.writeElement('property', {
                  name: 'attachment',
                  value: relative(dirname(this.reportFile), absPath),
                });
              }
            });
          }
        },
      );
    }
  }

  private writeFailureOrError(test: FakeTest): void {
    if (this.isImageMismatch(test)) {
      const bodyLines = Object.entries(test.creevey.images).map(
        ([step, img]) => `${step}: ${img?.error ?? 'expected and actual images differ'}`,
      );
      this.writeElement('failure', { message: 'Images do not match' }, undefined, bodyLines.join('\n'));
    } else if (test.err) {
      const firstLine = test.err.split('\n')[0];
      const type = /^(\w+Error):/.exec(test.err)?.[1] ?? 'Error';
      this.writeElement('error', { message: firstLine, type }, undefined, test.err);
    } else {
      this.writeElement('failure', { message: 'Test failed' });
    }
  }

  private onFinished(): void {
    this.logger.log('<?xml version="1.0" encoding="UTF-8" ?>');

    const suites = Object.entries(this.suites).map(([key, { suiteName, browserName, tests }]) => {
      let failures = 0;
      let errors = 0;
      let time = 0;
      for (const [, test] of tests) {
        if (test.state === 'failed') {
          if (this.isImageMismatch(test)) failures++;
          else if (test.err) errors++;
          else failures++;
        }
        time += test.duration ?? 0;
      }
      return {
        suiteName,
        browserName,
        tests,
        failures,
        errors,
        time,
        timestamp: toISO8601(this.suiteStartTimes[key] ?? this.runStartTime),
      };
    });
    const stats = suites.reduce(
      (s, { tests, failures, errors, time }) => {
        s.tests += tests.size;
        s.failures += failures;
        s.errors += errors;
        s.time += time;
        return s;
      },
      { name: 'creevey tests', tests: 0, failures: 0, errors: 0, time: 0 },
    );

    this.writeElement(
      'testsuites',
      { ...stats, time: executionTime(stats.time), timestamp: toISO8601(this.runStartTime) },
      () => {
        const hostname = os.hostname();
        suites.forEach(({ suiteName, browserName, tests, failures, errors, time, timestamp }, index) => {
          this.writeElement(
            'testsuite',
            {
              name: suiteName,
              tests: tests.size,
              failures,
              errors,
              time: executionTime(time),
              hostname,
              id: index,
              timestamp,
            },
            () => {
              this.writeElement('properties', {}, () => {
                this.writeElement('property', { name: 'browser', value: browserName });
              });
              this.writeTasks(tests);
            },
          );
        });
      },
    );

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

// ISO 8601 without timezone per Jenkins JUnit plugin convention: "2021-04-02T15:48:23"
function toISO8601(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '');
}
