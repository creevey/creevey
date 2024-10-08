import path from 'path';
import chai from 'chai';
import chalk from 'chalk';
import { Stats } from 'fs';
import assert from 'assert';
import { stat, readdir, readFile, writeFile, mkdir } from 'fs/promises';
import Mocha, { Context, MochaOptions } from 'mocha';
import { Key, until } from 'selenium-webdriver';
import { Config, Images, Options, TestMessage, isImageError } from '../../types.js';
import { subscribeOn, emitTestMessage, emitWorkerMessage } from '../messages.js';
import chaiImage from './chai-image.js';
import { closeBrowser, getBrowser, switchStory } from '../selenium/index.js';
import { CreeveyReporter, TeamcityReporter } from './reporter.js';
import { addTestsFromStories } from './helpers.js';
import { logger } from '../logger.js';

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

// FIXME browser options hotfix
export async function start(config: Config, options: Options & { browser: string }): Promise<void> {
  let retries = 0;
  let images: Partial<Record<string, Images>> = {};
  let error: string | undefined = undefined;
  const screenshots: { imageName?: string; screenshot: string }[] = [];
  const testScope: string[] = [];

  function runHandler(failures: number): void {
    if (failures > 0 && (error || Object.values(images).some((image) => image?.error != null))) {
      const isTimeout = hasTimeout(error) || Object.values(images).some((image) => hasTimeout(image?.error));
      const payload: { status: 'failed'; images: typeof images; error?: string } = {
        status: 'failed',
        images,
        error,
      };
      if (isTimeout) emitWorkerMessage({ type: 'error', payload: { error: error ?? 'Unknown error' } });
      else emitTestMessage({ type: 'end', payload });
    } else {
      emitTestMessage({ type: 'end', payload: { status: 'success', images } });
    }
  }

  async function saveImages(imageDir: string, images: { name: string; data: Buffer }[]): Promise<void> {
    await mkdir(imageDir, { recursive: true });
    for (const { name, data } of images) {
      await writeFile(path.join(imageDir, name), data);
    }
  }

  async function getExpected(
    assertImageName?: string,
  ): Promise<
    | { expected: Buffer | null; onCompare: (actual: Buffer, expect?: Buffer, diff?: Buffer) => Promise<void> }
    | Buffer
    | null
  > {
    // context => [title, name, test, browser]
    // rootSuite -> kindSuite -> storyTest -> [browsers.png]
    // rootSuite -> kindSuite -> storySuite -> test -> [browsers.png]
    const testPath = [...testScope];
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
        await saveImages(reportImageDir, imagesMeta);
      }
    };

    const expectImageDir = path.join(config.screenDir, ...testPath);
    const expectImageStat = await getStat(path.join(expectImageDir, `${imageName}.png`));
    if (!expectImageStat) return { expected: null, onCompare };

    const expected = await readFile(path.join(expectImageDir, `${imageName}.png`));

    return { expected, onCompare };
  }

  const mochaOptions: MochaOptions = {
    timeout: 30000,
    reporter: process.env.TEAMCITY_VERSION ? TeamcityReporter : (options.reporter ?? CreeveyReporter),
    reporterOptions: {
      reportDir: config.reportDir,
      topLevelSuite: options.browser,
      get willRetry() {
        return retries < config.maxRetries;
      },
      get images() {
        return images;
      },
      get sessionId() {
        return sessionId;
      },
    },
  };
  const mocha = new Mocha(mochaOptions);
  mocha.cleanReferencesAfterRun(false);

  chai.use(chaiImage(getExpected, config.diffOptions));

  if ((await getBrowser(config, options)) == null) return;

  await addTestsFromStories(mocha.suite, config, {
    browser: options.browser,
    watch: options.ui,
    debug: options.debug,
    port: options.port,
  });

  try {
    await (await getBrowser(config, options))?.getCurrentUrl();
  } catch {
    await closeBrowser();
  }
  const browser = await getBrowser(config, options);
  const sessionId = (await browser?.getSession())?.getId();

  if (browser == null) return;

  if (options.debug) {
    const interval = setInterval(
      () =>
        void browser.getCurrentUrl().then((url) => {
          logger.debug(`${options.browser}:${chalk.gray(sessionId)}`, 'current url', chalk.magenta(url));
        }),
      10 * 1000,
    );

    subscribeOn('shutdown', () => {
      clearInterval(interval);
    });
  }

  mocha.suite.beforeAll(function (this: Context) {
    this.config = config;
    this.browser = browser;
    this.until = until;
    this.keys = Key;
    this.expect = chai.expect;
    this.browserName = options.browser;
    this.testScope = testScope;
    this.screenshots = screenshots;
  });
  mocha.suite.beforeEach(switchStory);
  if (options.trace) {
    mocha.suite.afterEach(async function (this: Context) {
      const types = await browser.manage().logs().getAvailableLogTypes();
      for (const type of types) {
        const logs = await browser.manage().logs().get(type);
        logs.forEach((log) => {
          logger.debug(sessionId, this.currentTest?.titlePath().join('/'), log.toJSON());
        });
      }
    });
  }

  subscribeOn('test', (message: TestMessage) => {
    if (message.type != 'start') return;

    const test = message.payload;
    const testPath = test.path.join(' ').replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');

    images = {};
    error = undefined;
    retries = test.retries;

    mocha.grep(new RegExp(`^${testPath}$`));
    const runner = mocha.run(runHandler);

    // TODO How handle browser corruption?
    runner.on('fail', (_test, reason: unknown) => {
      if (!(reason instanceof Error)) {
        error = reason as string;
      } else if (!isImageError(reason)) {
        error = reason.stack ?? reason.message;
      } else if (typeof reason.images == 'string') {
        const image = images[testScope.slice(-1)[0]];
        if (image) image.error = reason.images;
      } else {
        const imageErrors = reason.images;
        Object.keys(imageErrors).forEach((imageName) => {
          const image = images[imageName];
          if (image) image.error = imageErrors[imageName];
        });
      }
    });
  });

  logger.info(`${options.browser}:${chalk.gray(sessionId)} is ready`);

  emitWorkerMessage({ type: 'ready' });
}

function hasTimeout(str: string | null | undefined): boolean {
  return str?.toLowerCase().includes('timeout') ?? false;
}
