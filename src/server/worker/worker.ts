import path from 'path';
import chai from 'chai';
import chalk from 'chalk';
import { Stats } from 'fs';
import assert from 'assert';
import Logger from 'loglevel';
import EventEmitter from 'events';
import { stat, readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { Key, until, WebDriver } from 'selenium-webdriver';
import {
  BaseCreeveyTestContext,
  Config,
  FakeSuite,
  FakeTest,
  Images,
  Options,
  ServerTest,
  TEST_EVENTS,
  TestMessage,
  isDefined,
  isImageError,
} from '../../types.js';
import { subscribeOn, emitTestMessage, emitWorkerMessage } from '../messages.js';
import chaiImage from './chai-image.js';
import { getBrowser, switchStory } from '../selenium/index.js';
import { getMatchers } from './match-image.js';
import { loadTestsFromStories } from '../stories.js';
import { logger } from '../logger.js';
import { getTestPath } from '../utils.js';

async function getStat(filePath: string): Promise<Stats | null> {
  try {
    return await stat(filePath);
  } catch (error) {
    if (typeof error == 'object' && error && (error as { code?: unknown }).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function getLastImageNumber(imageDir: string, imageName: string): Promise<number> {
  const actualImagesRegexp = new RegExp(`${imageName}-actual-(\\d+)\\.png`);

  try {
    return (
      (await readdir(imageDir))
        .map((filename) => filename.replace(actualImagesRegexp, '$1'))
        .map(Number)
        .filter((x) => !isNaN(x))
        .sort((a, b) => b - a)[0] ?? 0
    );
  } catch (_error) {
    return 0;
  }
}

async function getTestsFromStories(
  config: Config,
  { browser, ...options }: { browser: string; watch: boolean; debug: boolean; port: number },
): Promise<Map<string, ServerTest>> {
  const testsById = new Map<string, ServerTest>();
  const tests = await loadTestsFromStories(
    [browser],
    (listener) => config.storiesProvider(config, options, listener),
    (testsDiff) => {
      Object.entries(testsDiff).forEach(([id, newTest]) => {
        if (newTest) testsById.set(id, newTest);
        else testsById.delete(id);
      });
    },
  );

  Object.values(tests)
    .filter(isDefined)
    .forEach((test) => testsById.set(test.id, test));

  return testsById;
}

async function outputTraceLogs(browser: WebDriver, test: ServerTest, logger: Logger.Logger): Promise<void> {
  const output: string[] = [];
  const types = await browser.manage().logs().getAvailableLogTypes();
  for (const type of types) {
    const logs = await browser.manage().logs().get(type);
    output.push(logs.map((log) => JSON.stringify(log.toJSON(), null, 2)).join('\n'));
  }
  logger.debug(
    '----------',
    getTestPath(test).join('/'),
    '----------\n',
    output.join('\n'),
    '\n----------------------------------------------------------------------------------------------------',
  );
}

function runHandler(browserName: string, images: Partial<Record<string, Images>>, error?: unknown): void {
  // TODO How handle browser corruption?
  if (isImageError(error)) {
    if (typeof error.images == 'string') {
      const image = images[browserName];
      if (image) image.error = error.images;
    } else {
      const imageErrors = error.images ?? {};
      Object.keys(imageErrors).forEach((imageName) => {
        const image = images[imageName];
        if (image) image.error = imageErrors[imageName];
      });
    }
  }

  if (error || Object.values(images).some((image) => image?.error != null)) {
    const errorMessage = serializeError(error);

    const isUnexpectedError =
      hasTimeout(errorMessage) ||
      hasDisconnected(errorMessage) ||
      Object.values(images).some((image) => hasTimeout(image?.error));
    if (isUnexpectedError) emitWorkerMessage({ type: 'error', payload: { subtype: 'unknown', error: errorMessage } });
    else
      emitTestMessage({
        type: 'end',
        payload: {
          status: 'failed',
          images,
          error: errorMessage,
        },
      });
  } else {
    emitTestMessage({ type: 'end', payload: { status: 'success', images } });
  }
}

async function setupBrowser(getter: () => Promise<WebDriver | null>): Promise<[string, WebDriver] | undefined> {
  let browser: WebDriver | null = null;

  try {
    browser = await getter();
  } catch (error) {
    logger().error('Failed to start browser:', error);
    emitWorkerMessage({
      type: 'error',
      payload: { subtype: 'browser', error: serializeError(error) },
    });
  }

  if (browser == null) return;

  const sessionId = (await browser.getSession()).getId();

  return [sessionId, browser];
}

function keepAlive(browser: WebDriver): void {
  const interval = setInterval(
    () =>
      // NOTE Simple way to keep session alive
      void browser.getCurrentUrl().then((url) => {
        logger().debug('current url', chalk.magenta(url));
      }),
    10 * 1000,
  );

  subscribeOn('shutdown', () => {
    clearInterval(interval);
  });
}

async function saveImages(imageDir: string, images: { name: string; data: Buffer }[]): Promise<string[]> {
  const files: string[] = [];
  await mkdir(imageDir, { recursive: true });
  for (const { name, data } of images) {
    const filePath = path.join(imageDir, name);
    await writeFile(filePath, data);
    files.push(filePath);
  }
  return files;
}

function serializeError(error: unknown): string {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return error.stack ?? error.message;
  return error instanceof Object ? JSON.stringify(error) : String(error);
}

function hasDisconnected(str: string | null | undefined): boolean {
  return str?.toLowerCase().includes('disconnected') ?? false;
}

function hasTimeout(str: string | null | undefined): boolean {
  return str?.toLowerCase().includes('timeout') ?? false;
}

// FIXME browser options hotfix
export async function start(config: Config, options: Options & { browser: string }): Promise<void> {
  let retries = 0;
  let attachments: string[] = [];
  let testFullPath: string[] = [];
  let images: Partial<Record<string, Images>> = {};
  const [sessionId, browser] = (await setupBrowser(() => getBrowser(config, options))) ?? [];

  if (!browser || !sessionId) return;

  keepAlive(browser);

  async function getExpected(assertImageName?: string): Promise<{
    expected: Buffer | null;
    onCompare: (actual: Buffer, expect?: Buffer, diff?: Buffer) => Promise<void>;
  }> {
    const testPath = [...testFullPath];
    const imageName = assertImageName ?? testPath.pop();

    assert(typeof imageName === 'string', `Can't get image name from empty test scope`);

    const imagesMeta: { name: string; data: Buffer }[] = [];
    const reportImageDir = path.join(config.reportDir, ...testPath);
    const imageNumber = (await getLastImageNumber(reportImageDir, imageName)) + 1;
    const actualImageName = `${imageName}-actual-${imageNumber}.png`;
    const image = (images[imageName] = images[imageName] ?? { actual: actualImageName });
    const onCompare = async (actual: Buffer, expect?: Buffer, diff?: Buffer): Promise<void> => {
      imagesMeta.push({ name: image.actual, data: actual });

      if (diff && expect) {
        image.expect = `${imageName}-expect-${imageNumber}.png`;
        image.diff = `${imageName}-diff-${imageNumber}.png`;
        imagesMeta.push({ name: image.expect, data: expect });
        imagesMeta.push({ name: image.diff, data: diff });
      }
      if (options.saveReport) {
        attachments = await saveImages(reportImageDir, imagesMeta);
      }
    };

    const expectImageDir = path.join(config.screenDir, ...testPath);
    const expectImageStat = await getStat(path.join(expectImageDir, `${imageName}.png`));
    if (!expectImageStat) return { expected: null, onCompare };

    const expected = await readFile(path.join(expectImageDir, `${imageName}.png`));

    return { expected, onCompare };
  }

  const reporterOptions = {
    ...config.reporterOptions,
    creevey: {
      sessionId,
      reportDir: config.reportDir,
      browserName: options.browser,
      get willRetry() {
        return retries < config.maxRetries;
      },
      get images() {
        return images;
      },
    },
  };

  class FakeRunner extends EventEmitter {}
  const runner = new FakeRunner();
  const Reporter = config.reporter;
  new Reporter(runner, { reporterOptions });

  const { matchImage, matchImages } = getMatchers(getExpected, config.diffOptions);
  chai.use(chaiImage(matchImage, matchImages));

  const tests = await getTestsFromStories(config, {
    browser: options.browser,
    watch: options.ui,
    debug: options.debug,
    port: options.port,
  });

  subscribeOn('test', (message: TestMessage) => {
    if (message.type != 'start') return;

    const test = tests.get(message.payload.id);

    if (!test) {
      const error = `Test with id ${message.payload.id} not found`;
      logger().error(error);
      emitWorkerMessage({
        type: 'error',
        payload: { subtype: 'test', error },
      });
      return;
    }

    const baseContext: BaseCreeveyTestContext = {
      browserName: options.browser,
      browser: browser,
      screenshots: [],

      matchImage: matchImage,
      matchImages: matchImages,

      // NOTE: Deprecated
      expect: chai.expect,
      until: until,
      keys: Key,
    };

    images = {};
    attachments = [];
    retries = message.payload.retries;
    testFullPath = getTestPath(test);
    let error = undefined;

    const fakeSuite: FakeSuite = {
      title: test.storyPath.slice(0, -1).join('/'),
      fullTitle: () => fakeSuite.title,
      titlePath: () => [fakeSuite.title],
      tests: [],
    };

    const fakeTest: FakeTest = {
      parent: fakeSuite,
      title: [test.story.name, test.testName, test.browser].filter(isDefined).join('/'),
      fullTitle: () => getTestPath(test).join('/'),
      titlePath: () => getTestPath(test),
      currentRetry: () => retries,
      retires: () => config.maxRetries,
      slow: () => 1000,
    };

    fakeSuite.tests.push(fakeTest);

    void (async () => {
      runner.emit(TEST_EVENTS.RUN_BEGIN);
      runner.emit(TEST_EVENTS.TEST_BEGIN, fakeTest);

      const start = Date.now();
      try {
        await Promise.race([
          new Promise((reject) =>
            setTimeout(() => {
              reject(`Timeout of ${config.testTimeout}ms exceeded`);
            }, config.testTimeout),
          ),
          (async () => {
            const context = await switchStory(test.story, baseContext);
            await test.fn(context);
          })(),
        ]);
      } catch (testError) {
        error = testError;
        fakeTest.err = error;
      }
      const duration = Date.now() - start;
      fakeTest.attachments = attachments;
      fakeTest.state = error ? 'failed' : 'passed';
      fakeTest.duration = duration;
      fakeTest.speed = duration > fakeTest.slow() ? 'slow' : duration / 2 > fakeTest.slow() ? 'medium' : 'fast';

      if (error) {
        runner.emit(TEST_EVENTS.TEST_FAIL, fakeTest, error);
      } else {
        runner.emit(TEST_EVENTS.TEST_PASS, fakeTest);
      }
      runner.emit(TEST_EVENTS.TEST_END, fakeTest);
      runner.emit(TEST_EVENTS.RUN_END);

      if (options.trace) {
        try {
          await outputTraceLogs(browser, test, logger());
        } catch (_) {
          /* noop */
        }
      }

      runHandler(baseContext.browserName, images, error);
    })().catch((error: unknown) => {
      logger().error('Unexpected error:', error);
      emitWorkerMessage({
        type: 'error',
        payload: { subtype: 'test', error: serializeError(error) },
      });
    });
  });

  logger().info('Browser is ready');

  emitWorkerMessage({ type: 'ready' });
}
