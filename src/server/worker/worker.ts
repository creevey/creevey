import chai from 'chai';
import chalk from 'chalk';
import Logger from 'loglevel';
import EventEmitter from 'events';
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
import { getMatchers, getOdiffMatchers, ImageContext } from './match-image.js';
import { loadTestsFromStories } from '../stories.js';
import { logger } from '../logger.js';
import { getTestPath } from '../utils.js';

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

function serializeError(error: unknown): string {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return error.stack ?? error.message;
  return typeof error === 'object' ? JSON.stringify(error) : (error as string);
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
  const imagesContext: ImageContext = {
    attachments: [],
    testFullPath: [],
    images: {},
  };
  const [sessionId, browser] = (await setupBrowser(() => getBrowser(config, options))) ?? [];

  if (!browser || !sessionId) return;

  keepAlive(browser);

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
        return imagesContext.images;
      },
    },
  };

  class FakeRunner extends EventEmitter {}
  const runner = new FakeRunner();
  const Reporter = config.reporter;
  new Reporter(runner, { reporterOptions });

  const { matchImage, matchImages } = options.odiff
    ? getOdiffMatchers(imagesContext, config)
    : await getMatchers(imagesContext, config);
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

    imagesContext.attachments = [];
    imagesContext.testFullPath = getTestPath(test);
    imagesContext.images = {};

    retries = message.payload.retries;
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
      fakeTest.attachments = imagesContext.attachments;
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

      runHandler(baseContext.browserName, imagesContext.images, error);
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
