import chai from 'chai';
import {
  BaseCreeveyTestContext,
  Config,
  CreeveyWebdriver,
  ServerTest,
  TestResult,
  WorkerOptions,
  StoryInput,
  CaptureOptions,
  isDefined,
  isImageError,
} from '../../types.js';
import { createMasterRPC, WorkerRPC } from '../birpc-ipc.js';
import chaiImage from './chai-image.js';
import { getMatchers, getOdiffMatchers } from './match-image.js';
import { loadTestsFromStories } from '../stories.js';
import { logger } from '../logger.js';
import { getTestPath } from '../utils.js';
import { ImageContext } from '../compare.js';

// Global variables to maintain state across RPC calls
let globalTests: Map<string, ServerTest> | null = null;
let globalWebdriver: CreeveyWebdriver | null = null;
let globalBrowser = '';
let globalConfig: Config | null = null;
let globalImagesContext: ImageContext | null = null;
let globalMatchImage: ((image: string | Buffer, imageName?: string) => Promise<void>) | null = null;
let globalMatchImages: ((images: Record<string, string | Buffer>) => Promise<void>) | null = null;
let masterRPC: ReturnType<typeof createMasterRPC> | null = null;

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

async function runHandler(browserName: string, result: Omit<TestResult, 'status'>, error?: unknown): Promise<void> {
  if (!masterRPC) return;

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
    
    if (isUnexpectedError) {
      await masterRPC.onWorkerError({ subtype: 'unknown', error: errorMessage });
    } else {
      await masterRPC.onTestEnd({
        status: 'failed',
        ...result,
      });
    }
  } else {
    await masterRPC.onTestEnd({
      status: 'success',
      ...result,
    });
  }
}

async function setupWebdriver(webdriver: CreeveyWebdriver): Promise<[string, CreeveyWebdriver] | undefined> {
  if (!masterRPC) return;

  if ((await webdriver.openBrowser(true)) == null) {
    logger().error('Failed to start browser');
    await masterRPC.onWorkerError({
      subtype: 'browser',
      error: 'Failed to start browser',
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

// Implement WorkerRPC interface methods
const workerFunctions: WorkerRPC = {
  async startTest(test: { id: string; path: string[]; retries: number }): Promise<void> {
    if (!globalTests || !globalWebdriver || !globalConfig || !globalImagesContext || !masterRPC) {
      logger().error('Worker not properly initialized');
      await masterRPC?.onWorkerError({
        subtype: 'test',
        error: 'Worker not properly initialized',
      });
      return;
    }

    const serverTest = globalTests.get(test.id);

    if (!serverTest) {
      const error = `Test with id ${test.id} not found`;
      logger().error(error);
      await masterRPC.onWorkerError({
        subtype: 'test',
        error,
      });
      return;
    }

    if (!globalMatchImage || !globalMatchImages) {
      await masterRPC.onWorkerError({
        subtype: 'test',
        error: 'Match functions not initialized',
      });
      return;
    }

    const baseContext: BaseCreeveyTestContext = {
      browserName: globalBrowser,
      // @ts-expect-error We defined separate d.ts declarations for each webdriver
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      webdriver: globalWebdriver.browser,
      screenshots: [],

      matchImage: globalMatchImage,
      matchImages: globalMatchImages,

      // NOTE: Deprecated
      expect: chai.expect,
    };

    globalImagesContext.attachments = [];
    globalImagesContext.testFullPath = getTestPath(serverTest);
    globalImagesContext.images = {};

    let error = undefined;

    try {
      let timeout;
      let isRejected = false;
      const start = Date.now();
      try {
        await Promise.race([
          new Promise(
            (_, reject) =>
              (timeout = setTimeout(() => {
                isRejected = true;
                reject(new Error(`Timeout of ${globalConfig.testTimeout}ms exceeded`));
              }, globalConfig.testTimeout)),
          ),
          (async () => {
            if (!globalWebdriver) throw new Error('Webdriver not initialized');
            const context = await globalWebdriver.switchStory(serverTest.story, baseContext);
            await serverTest.fn(context);
          })(),
        ]);
      } catch (testError) {
        error = testError;
      }
      const duration = Date.now() - start;
      clearTimeout(timeout);

      await globalWebdriver.afterTest(serverTest);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (isRejected) {
        await masterRPC.onWorkerError({
          subtype: 'unknown',
          error: serializeError(error),
        });
      } else {
        const sessionId = await globalWebdriver.getSessionId();
        const result = {
          sessionId,
          browserName: baseContext.browserName,
          workerId: process.pid,
          images: globalImagesContext.images,
          error: error ? serializeError(error) : undefined,
          duration,
          attachments: globalImagesContext.attachments,
          retries: test.retries,
        };
        await runHandler(baseContext.browserName, result, error);
      }
    } catch (unexpectedError) {
      logger().error('Unexpected error:', unexpectedError);
      await masterRPC.onWorkerError({
        subtype: 'test',
        error: serializeError(unexpectedError),
      });
    }
  },

  updateStories(stories: [string, StoryInput[]][]): Promise<void> {
    // Handle stories update if needed
    logger().info('Stories updated:', stories.length);
    return Promise.resolve();
  },

  async captureStory(options?: CaptureOptions): Promise<void> {
    // Handle story capture if needed
    logger().info('Capture story requested:', options);
    if (masterRPC) {
      await masterRPC.onStoriesCapture();
    }
  },

  async shutdown(): Promise<void> {
    logger().info('Worker shutdown requested');
    if (globalWebdriver) {
      try {
        await globalWebdriver.closeBrowser();
      } catch (error) {
        logger().error('Error closing browser:', error);
      }
    }
    process.exit(0);
  },
};

export async function start(browser: string, gridUrl: string, config: Config, options: WorkerOptions): Promise<void> {
  globalBrowser = browser;
  globalConfig = config;
  
  globalImagesContext = {
    attachments: [],
    testFullPath: [],
    images: {},
  };
  
  const Webdriver = config.webdriver;
  const webdriverResult = await setupWebdriver(new Webdriver(browser, gridUrl, config, options));
  
  if (!webdriverResult) return;
  
  const [sessionId, webdriver] = webdriverResult;
  globalWebdriver = webdriver;

  const { matchImage, matchImages } = options.odiff
    ? await getOdiffMatchers(globalImagesContext, config)
    : await getMatchers(globalImagesContext, config);
  
  globalMatchImage = matchImage;
  globalMatchImages = matchImages;
  chai.use(chaiImage(matchImage, matchImages));

  try {
    globalTests = await getTestsFromStories(config, browser, webdriver);
  } catch (error) {
    logger().error('Failed to get tests from stories:', error);
    if (masterRPC) {
      await masterRPC.onWorkerError({
        subtype: 'browser',
        error: serializeError(error),
      });
    }
    return;
  }

  if (!globalTests) return;

  // Create RPC connection to master
  masterRPC = createMasterRPC(workerFunctions);

  logger().info('Browser is ready');

  // Notify master that worker is ready
  await masterRPC.onWorkerReady();
}
