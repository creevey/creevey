import { describe, test, expect, afterEach } from 'vitest';
import EventEmitter from 'events';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { readFileSync, unlinkSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { TEST_EVENTS } from '../../src/types.js';
import { JUnitReporter } from '../../src/server/reporters/junit.js';
import type { FakeTest, FakeSuite, Images } from '../../src/types.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const createdFiles: string[] = [];

function tempXmlPath(): string {
  const p = join(tmpdir(), `junit-test-${randomUUID()}.xml`);
  createdFiles.push(p);
  return p;
}

interface FakeTestOptions {
  storyTitle?: string;
  testTitle?: string;
  browserName?: string;
  state?: 'passed' | 'failed';
  err?: string;
  duration?: number;
  attachments?: string[];
  images?: Partial<Record<string, Partial<Images>>>;
}

function makeFakeTest(opts: FakeTestOptions = {}): FakeTest {
  const storyTitle = opts.storyTitle ?? 'My Story';
  const testTitle = opts.testTitle ?? 'my test';
  const browserName = opts.browserName ?? 'chrome';

  const suite: FakeSuite = {
    title: storyTitle,
    fullTitle: () => storyTitle,
    titlePath: () => [storyTitle],
    tests: [],
  };

  return {
    parent: suite,
    title: testTitle,
    fullTitle: () => `${storyTitle} ${testTitle}`,
    titlePath: () => [storyTitle, testTitle],
    currentRetry: () => 0,
    retires: () => 0,
    slow: () => 0,
    duration: opts.duration ?? 100,
    state: opts.state ?? 'passed',
    err: opts.err,
    attachments: opts.attachments,
    creevey: {
      testId: `${storyTitle}/${testTitle}`,
      sessionId: 'session-1',
      browserName,
      workerId: 1,
      willRetry: false,
      images: opts.images ?? {},
    },
  };
}

function runReporter(tests: FakeTest[], outputFile: string): string {
  const runner = new EventEmitter();
  new JUnitReporter(runner, {
    reportDir: dirname(outputFile),
    reporterOptions: { outputFile },
  });

  runner.emit(TEST_EVENTS.RUN_BEGIN);
  for (const test of tests) {
    runner.emit(TEST_EVENTS.TEST_BEGIN, test);
    if (test.state === 'passed') {
      runner.emit(TEST_EVENTS.TEST_PASS, test);
    } else {
      runner.emit(TEST_EVENTS.TEST_FAIL, test);
    }
  }
  runner.emit(TEST_EVENTS.RUN_END);

  return readFileSync(outputFile, 'utf-8');
}

afterEach(() => {
  for (const p of createdFiles.splice(0)) {
    if (existsSync(p)) unlinkSync(p);
  }
});

// ── smoke test ────────────────────────────────────────────────────────────────

describe('JUnitReporter', () => {
  test('produces valid XML for a single passing test', () => {
    const out = tempXmlPath();
    const xml = runReporter([makeFakeTest()], out);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8" ?>');
    expect(xml).toContain('<testsuites');
    expect(xml).toContain('<testsuite');
    expect(xml).toContain('<testcase');
    expect(xml).toContain('name="my test"');
  });

  describe('failure body', () => {
    test.fails('writes failure element with text body when images are present', () => {
      const out = tempXmlPath();
      const test = makeFakeTest({
        state: 'failed',
        images: { header: { error: 'images differ by 5%' } },
      });
      const xml = runReporter([test], out);
      expect(xml).toContain('<failure');
      expect(xml).toContain('header: images differ by 5%');
      expect(xml).toContain('</failure>');
    });
  });

  describe('multi-browser suites', () => {
    test('creates separate testsuite elements for each browser', () => {
      const out = tempXmlPath();
      const chromeTest = makeFakeTest({ storyTitle: 'Button', browserName: 'chrome' });
      const firefoxTest = makeFakeTest({ storyTitle: 'Button', browserName: 'firefox' });
      const xml = runReporter([chromeTest, firefoxTest], out);

      // Should have TWO <testsuite> elements, one per browser
      const suiteMatches = xml.match(/<testsuite /g) ?? [];
      expect(suiteMatches.length).toBe(2);
      expect(xml).toContain('value="chrome"');
      expect(xml).toContain('value="firefox"');
    });

    test('adds browser property to each testsuite', () => {
      const out = tempXmlPath();
      const test = makeFakeTest({ storyTitle: 'Button', browserName: 'chrome' });
      const xml = runReporter([test], out);

      expect(xml).toContain('<property name="browser" value="chrome"');
    });
  });
});
