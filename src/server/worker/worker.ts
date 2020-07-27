import { promisify } from 'util';
import fs, { Stats } from 'fs';
import path from 'path';
import chai from 'chai';
import chalk from 'chalk';
import Mocha, { Context, MochaOptions } from 'mocha';
import { Key } from 'selenium-webdriver';
import { Config, Images, Options, BrowserConfig, WorkerMessage, TestWorkerMessage } from '../../types';
import { emitMessage, subscribeOn } from '../../utils';
import chaiImage from './chai-image';
import { getBrowser, switchStory } from './selenium';
import { CreeveyReporter, TeamcityReporter } from './reporter';
import { addTestsFromStories } from './helpers';

const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

async function getStat(filePath: string): Promise<Stats | null> {
  try {
    return await statAsync(filePath);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function getLastImageNumber(imageDir: string, imageName: string): Promise<number> {
  const actualImagesRegexp = new RegExp(`${imageName}-actual-(\\d+)\\.png`);

  try {
    return (
      (await readdirAsync(imageDir))
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
export default async function worker(
  config: Config,
  options: Options & { browser: string; storybookBundle: string },
): Promise<void> {
  let retries = 0;
  let images: Partial<{ [name: string]: Images }> = {};
  let error: string | null = null;
  const testScope: string[] = [];

  function runHandler(failures: number): void {
    if (failures > 0 && error) {
      const isTimeout = error.toLowerCase().includes('timeout');
      const payload: { status: 'failed'; images: typeof images; error: string } = { status: 'failed', images, error };
      emitMessage<WorkerMessage>(isTimeout ? { type: 'error', payload } : { type: 'test', payload });
    } else {
      emitMessage<WorkerMessage>({ type: 'test', payload: { status: 'success', images } });
    }
  }

  async function saveImages(imageDir: string, images: { name: string; data: Buffer }[]): Promise<void> {
    await mkdirAsync(imageDir, { recursive: true });
    for (const { name, data } of images) {
      await writeFileAsync(path.join(imageDir, name), data);
    }
  }

  async function getExpected(
    assertImageName?: string,
  ): Promise<
    | { expected: Buffer | null; onCompare: (actual: Buffer, expect?: Buffer, diff?: Buffer) => Promise<void> }
    | Buffer
    | null
  > {
    // context => [kind, story, test, browser]
    // rootSuite -> kindSuite -> storyTest -> [browsers.png]
    // rootSuite -> kindSuite -> storySuite -> test -> [browsers.png]
    const testPath = [...testScope];
    const imageName = assertImageName ?? (testPath.pop() as string);

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

    const expected = await readFileAsync(path.join(expectImageDir, `${imageName}.png`));

    return { expected, onCompare };
  }

  const mochaOptions: MochaOptions = {
    timeout: 30000,
    reporter: process.env.TEAMCITY_VERSION ? TeamcityReporter : options.reporter || CreeveyReporter,
    reporterOptions: {
      reportDir: config.reportDir,
      topLevelSuite: options.browser,
      willRetry: () => retries < config.maxRetries,
      images: () => images,
    },
  };
  const mocha = new Mocha(mochaOptions);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  mocha.cleanReferencesAfterRun(false);

  chai.use(chaiImage(getExpected, config.diffOptions));

  await addTestsFromStories(mocha.suite, {
    browser: options.browser,
    storybookBundlePath: options.storybookBundle,
    watch: options.ui,
  });

  const browserConfig = config.browsers[options.browser] as BrowserConfig;
  const browser = await getBrowser(config, browserConfig);

  const interval = setInterval(
    () =>
      void browser.getCurrentUrl().then((url) => {
        if (options.debug)
          console.log(chalk`[{blue WORKER}{grey :${options.browser}:${process.pid}}] {grey current url} ${url}`);
      }),
    10 * 1000,
  );

  subscribeOn('shutdown', () => clearInterval(interval));

  mocha.suite.beforeAll(function (this: Context) {
    this.config = config;
    this.browser = browser;
    this.keys = Key;
    this.expect = chai.expect;
    this.browserName = options.browser;
    this.testScope = testScope;
  });
  mocha.suite.beforeEach(switchStory);

  subscribeOn('tests', (test: TestWorkerMessage) => {
    const testPath = [...test.path]
      .reverse()
      .join(' ')
      .replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');

    images = {};
    error = null;
    retries = test.retries;

    mocha.grep(new RegExp(`^${testPath}$`));
    const runner = mocha.run(runHandler);

    // TODO How handle browser corruption?
    runner.on(
      'fail',
      (_test, reason: unknown) =>
        (error = reason instanceof Error ? reason.stack ?? reason.message : (reason as string)),
    );
  });

  console.log('[CreeveyWorker]:', `Ready ${options.browser}:${process.pid}`);

  emitMessage<WorkerMessage>({ type: 'ready' });
}
