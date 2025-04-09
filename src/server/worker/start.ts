import chai from 'chai';
import {
  BaseCreeveyTestContext,
  Config,
  CreeveyWebdriver,
  Options,
  ServerTest,
  TestMessage,
  TestResult,
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

function runHandler(browserName: string, result: Omit<TestResult, 'status'>, error?: unknown): void {
  // TODO How handle browser corruption?
  const { images } = result;
  if (images != null && isImageError(error)) {
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

  if (error || (images != null && Object.values(images).some((image) => image?.error != null))) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const errorMessage = result.error!;

    const isUnexpectedError =
      hasTimeout(errorMessage) ||
      hasDisconnected(errorMessage) ||
      (images != null && Object.values(images).some((image) => hasTimeout(image?.error)));
    if (isUnexpectedError) emitWorkerMessage({ type: 'error', payload: { subtype: 'unknown', error: errorMessage } });
    else
      emitTestMessage({
        type: 'end',
        payload: {
          status: 'failed',
          ...result,
        },
      });
  } else {
    emitTestMessage({
      type: 'end',
      payload: {
        status: 'success',
        ...result,
      },
    });
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
  const imagesContext: ImageContext = {
    attachments: [],
    testFullPath: [],
    images: {},
  };
  const Webdriver = config.webdriver;
  const [sessionId, webdriver] = (await setupWebdriver(new Webdriver(browser, gridUrl, config, options))) ?? [];

  if (!webdriver || !sessionId) return;

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

    let error = undefined;

    void (async () => {
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
      }
      const duration = Date.now() - start;
      clearTimeout(timeout);

      await webdriver.afterTest(test);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (isRejected) {
        emitWorkerMessage({
          type: 'error',
          payload: { subtype: 'unknown', error: serializeError(error) },
        });
      } else {
        const result = {
          sessionId,
          images: imagesContext.images,
          error: serializeError(error),
          duration,
          attachments: imagesContext.attachments,
          retries: message.payload.retries,
        };
        runHandler(baseContext.browserName, result, error);
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
