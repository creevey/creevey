import { describe, test, expect, afterEach } from 'vitest';
import EventEmitter from 'events';
import { join, dirname, relative } from 'path';
import os, { tmpdir } from 'os';
import { readFileSync, unlinkSync, existsSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { TEST_EVENTS } from '../../src/types.js';
import { JUnitReporter } from '../../src/server/reporters/junit.js';
import type { FakeTest, FakeSuite, Images } from '../../src/types.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const createdFiles: string[] = [];
const createdDirectories: string[] = [];

function tempXmlPath(): string {
  const p = join(tmpdir(), `junit-test-${randomUUID()}.xml`);
  createdFiles.push(p);
  return p;
}

function tempRepoReportXmlPath(): string {
  const outputDir = join(process.cwd(), 'report', `junit-test-${randomUUID()}`);
  const outputFile = join(outputDir, 'junit.xml');
  createdDirectories.push(outputDir);
  createdFiles.push(outputFile);
  return outputFile;
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

  for (const dir of createdDirectories.splice(0)) {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
});

// ── smoke test ────────────────────────────────────────────────────────────────

describe('JUnitReporter', () => {
  test('falls back to reportDir when reporterOptions is undefined', () => {
    const outputDir = join(tmpdir(), `junit-dir-${randomUUID()}`);
    const outputFile = join(outputDir, 'junit.xml');
    createdDirectories.push(outputDir);
    createdFiles.push(outputFile);

    const runner = new EventEmitter();
    const test = makeFakeTest();

    expect(() => {
      new JUnitReporter(runner, {
        reportDir: outputDir,
        reporterOptions: undefined as never,
      });
    }).not.toThrow();

    runner.emit(TEST_EVENTS.RUN_BEGIN);
    runner.emit(TEST_EVENTS.TEST_BEGIN, test);
    runner.emit(TEST_EVENTS.TEST_PASS, test);
    runner.emit(TEST_EVENTS.RUN_END);

    expect(readFileSync(outputFile, 'utf-8')).toContain('<testsuites');
  });

  test('produces valid XML for a single passing test', () => {
    const out = tempXmlPath();
    const xml = runReporter([makeFakeTest()], out);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8" ?>');
    expect(xml).toContain('<testsuites');
    expect(xml).toContain('<testsuite');
    expect(xml).toContain('<testcase');
    expect(xml).toContain('name="my test"');
  });

  describe('failure and error elements', () => {
    test('writes failure with per-step body for image mismatches', () => {
      const out = tempXmlPath();
      const t = makeFakeTest({
        state: 'failed',
        images: {
          header: { error: 'header differs by 3%' },
          body: { actual: '/tmp/body.png' }, // no error string
        },
      });
      const xml = runReporter([t], out);
      expect(xml).toContain('<failure');
      expect(xml).toContain('message="Images do not match"');
      expect(xml).toContain('header: header differs by 3%');
      expect(xml).toContain('body: expected and actual images differ');
      expect(xml).toContain('</failure>');
    });

    test('writes error element for crash with no images', () => {
      const out = tempXmlPath();
      const t = makeFakeTest({
        state: 'failed',
        err: 'TypeError: Cannot read properties of null',
      });
      const xml = runReporter([t], out);
      expect(xml).toContain('<error');
      expect(xml).toContain('message="TypeError: Cannot read properties of null"');
      expect(xml).toContain('TypeError: Cannot read properties of null');
      expect(xml).toContain('</error>');
      expect(xml).not.toContain('<failure');
    });

    test('counts errors and failures separately on testsuite', () => {
      const out = tempXmlPath();
      const imageFail = makeFakeTest({
        storyTitle: 'Story',
        testTitle: 'img fail',
        state: 'failed',
        images: { header: {} },
      });
      const crash = makeFakeTest({
        storyTitle: 'Story',
        testTitle: 'crash',
        state: 'failed',
        err: 'boom',
      });
      const xml = runReporter([imageFail, crash], out);
      // 1 failure (image) + 1 error (crash)
      expect(xml).toMatch(/failures="1"/);
      expect(xml).toMatch(/errors="1"/);
    });

    test('writes fallback failure when state is failed but no images and no err', () => {
      const out = tempXmlPath();
      const t = makeFakeTest({ state: 'failed' });
      const xml = runReporter([t], out);
      expect(xml).toContain('<failure');
      expect(xml).toContain('message="Test failed"');
      // Fallback should count as failure, not error
      expect(xml).toMatch(/failures="1"/);
      expect(xml).not.toMatch(/errors="[^0]/);
    });

    test('writes failure element with text body when images are present', () => {
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

  describe('screenshot attachments', () => {
    test('writes attachment properties and GitLab system-out tags relative to the report file', () => {
      const out = tempRepoReportXmlPath();
      const absPath = join(dirname(out), 'Button', 'primary', 'chrome', 'button-actual-1.png');
      const t = makeFakeTest({
        state: 'failed',
        images: { header: {} },
        attachments: [absPath],
      });
      const xml = runReporter([t], out);
      const normalizedXml = xml.replaceAll('\\', '/');

      expect(normalizedXml).toContain('<properties>');
      expect(normalizedXml).toContain('name="attachment"');
      expect(normalizedXml).toContain('value="Button/primary/chrome/button-actual-1.png"');
      expect(normalizedXml).toContain('</properties>');
      expect(normalizedXml).toContain('<system-out>');
      expect(normalizedXml).toContain('[[ATTACHMENT|report/');
      expect(normalizedXml).toContain('Button/primary/chrome/button-actual-1.png]]');
      expect(normalizedXml).toContain('</system-out>');
    });

    test('no attachment properties block when attachments is empty', () => {
      const out = tempXmlPath();
      const t = makeFakeTest({ state: 'passed', attachments: [] });
      const xml = runReporter([t], out);
      // The only <properties> block that may appear is in <testsuite> (browser prop) — not in testcase
      // We verify there's no attachment property
      expect(xml).not.toContain('name="attachment"');
      expect(xml).not.toContain('[[ATTACHMENT|');
      expect(xml).not.toContain('<system-out>');
    });

    test('no attachment properties block when attachments is undefined', () => {
      const out = tempXmlPath();
      const t = makeFakeTest({ state: 'passed' }); // attachments not set
      const xml = runReporter([t], out);
      expect(xml).not.toContain('name="attachment"');
      expect(xml).not.toContain('[[ATTACHMENT|');
      expect(xml).not.toContain('<system-out>');
    });

    test('writes one property element per attachment', () => {
      const out = tempXmlPath();
      const base = dirname(out);
      const t = makeFakeTest({
        state: 'failed',
        images: { header: {} },
        attachments: [join(base, 'screen-actual.png'), join(base, 'screen-diff.png')],
      });
      const xml = runReporter([t], out);
      const normalizedXml = xml.replaceAll('\\', '/');

      const matches = normalizedXml.match(/name="attachment"/g) ?? [];
      const attachmentMarkers = normalizedXml.match(/\[\[ATTACHMENT\|/g) ?? [];
      expect(matches).toHaveLength(2);
      expect(attachmentMarkers).toHaveLength(2);
      expect(normalizedXml).toContain('value="screen-actual.png"');
      expect(normalizedXml).toContain('value="screen-diff.png"');
    });

    test('uses CI_PROJECT_DIR for GitLab system-out attachment markers when set', () => {
      const out = tempRepoReportXmlPath();
      const absPath = join(dirname(out), 'Button', 'primary', 'chrome', 'button-actual-1.png');
      const t = makeFakeTest({
        state: 'failed',
        images: { header: {} },
        attachments: [absPath],
      });
      const originalCiProjectDir = process.env.CI_PROJECT_DIR;
      const ciProjectDir = dirname(process.cwd());

      try {
        process.env.CI_PROJECT_DIR = ciProjectDir;

        const xml = runReporter([t], out);
        const expectedPath = relative(ciProjectDir, absPath).replaceAll('\\', '/');

        expect(xml).toContain(`[[ATTACHMENT|${expectedPath}]]`);
      } finally {
        if (originalCiProjectDir === undefined) {
          delete process.env.CI_PROJECT_DIR;
        } else {
          process.env.CI_PROJECT_DIR = originalCiProjectDir;
        }
      }
    });
  });

  describe('testsuite spec attributes', () => {
    test('includes hostname attribute on testsuite', () => {
      const out = tempXmlPath();
      const xml = runReporter([makeFakeTest()], out);
      expect(xml).toContain(`hostname="${os.hostname()}"`);
    });

    test('includes sequential id starting at 0 on each testsuite', () => {
      const out = tempXmlPath();
      const a = makeFakeTest({ storyTitle: 'Alpha', browserName: 'chrome' });
      const b = makeFakeTest({ storyTitle: 'Beta', browserName: 'chrome' });
      const xml = runReporter([a, b], out);
      expect(xml).toMatch(/<testsuite [^>]*id="0"/);
      expect(xml).toMatch(/<testsuite [^>]*id="1"/);
      const suiteMatches = [...xml.matchAll(/<testsuite [^>]*id="(\d+)"/g)].map((m) => m[1]);
      expect(suiteMatches).toEqual(['0', '1']);
    });
  });
});
