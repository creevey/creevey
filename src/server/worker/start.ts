import chai from 'chai';
import EventEmitter from 'events';
import {
  BaseCreeveyTestContext,
  Config,
  CreeveyWebdriver,
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
import { getMatchers, getOdiffMatchers, ImageContext } from './match-image.js';
import { loadTestsFromStories } from '../stories.js';
import { logger } from '../logger.js';
import { getTestPath } from '../utils.js';

async function getTestsFromStories(
  config: Config,
  browserName: string,
  webdriver: CreeveyWebdriver,
): Promise<Map<string, ServerTest>> {
  const testsById = new Map<string, ServerTest>();
  const tests = await loadTestsFromStories(
    [browserName],
    (listener) => config.storiesProvider(config, listener, webdriver),
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

async function setupWebdriver(webdriver: CreeveyWebdriver): Promise<[string, CreeveyWebdriver] | undefined> {
  if ((await webdriver.openBrowser(true)) == null) {
    logger().error('Failed to start browser');
    emitWorkerMessage({
      type: 'error',
      payload: { subtype: 'browser', error: 'Failed to start browser' },
    });
    return;
  }

  const sessionId = await webdriver.getSessionId();

  return [sessionId, webdriver];
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

export async function start(browser: string, gridUrl: string, config: Config, options: Options): Promise<void> {
  let retries = 0;
  const imagesContext: ImageContext = {
    attachments: [],
    testFullPath: [],
    images: {},
  };
  const Webdriver = config.webdriver;
  const [sessionId, webdriver] = (await setupWebdriver(new Webdriver(browser, gridUrl, config, options))) ?? [];

  if (!webdriver || !sessionId) return;

  const reporterOptions = {
    ...config.reporterOptions,
    creevey: {
      sessionId,
      reportDir: config.reportDir,
      browserName: browser,
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

  const tests = await (async () => {
    try {
      return await getTestsFromStories(config, browser, webdriver);
    } catch (error) {
      logger().error('Failed to get tests from stories:', error);
      emitWorkerMessage({
        type: 'error',
        payload: { subtype: 'browser', error: serializeError(error) },
      });
      return null;
    }
  })();

  if (!tests) return;

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
      browserName: browser,
      // @ts-expect-error We defined separate d.ts declarations for each webdriver
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      webdriver: webdriver.browser,
      screenshots: [],

      matchImage: matchImage,
      matchImages: matchImages,

      // NOTE: Deprecated
      expect: chai.expect,
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

      let timeout;
      let isRejected = false;
      const start = Date.now();
      try {
        await Promise.race([
          new Promise(
            (_, reject) =>
              (timeout = setTimeout(() => {
                isRejected = true;
                reject(new Error(`Timeout of ${config.testTimeout}ms exceeded`));
              }, config.testTimeout)),
          ),
          (async () => {
            const context = await webdriver.switchStory(test.story, baseContext);
            await test.fn(context);
          })(),
        ]);
      } catch (testError) {
        error = testError;
        fakeTest.err = error;
      }
      const duration = Date.now() - start;
      clearTimeout(timeout);
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

      await webdriver.afterTest(test);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (isRejected) {
        emitWorkerMessage({
          type: 'error',
          payload: { subtype: 'unknown', error: serializeError(error) },
        });
      } else {
        runHandler(baseContext.browserName, imagesContext.images, error);
      }
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
