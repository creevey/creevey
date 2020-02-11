import { promisify } from 'util';
import fs, { Stats } from 'fs';
import path from 'path';
import chai from 'chai';
import chalk from 'chalk';
import Mocha, { Suite, Context, AsyncFunc, MochaOptions } from 'mocha';
import { Config, Images, Options, BrowserConfig, noop } from '../../types';
import { getBrowser, switchStory } from '../../utils';
import chaiImage from '../../chai-image';
import { loadStories } from '../../stories';
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
        .map(filename => filename.replace(actualImagesRegexp, '$1'))
        .map(Number)
        .filter(x => !isNaN(x))
        .sort((a, b) => b - a)[0] ?? 0
    );
  } catch (_error) {
    return 0;
  }
}

// After end of each suite mocha clean all hooks and don't allow re-run tests without full re-init
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore see issue for more info https://github.com/mochajs/mocha/issues/2783
Suite.prototype.cleanReferences = noop;

function patchMochaInterface(suite: Suite): void {
  suite.on('pre-require', context => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    context.it.skip = (_browsers: string[], title: string, fn?: AsyncFunc) => context.it(title, fn);
  });
}

// FIXME browser options hotfix
export default async function worker(config: Config, options: Options & { browser: string }): Promise<void> {
  let retries = 0;
  let images: Partial<{ [name: string]: Partial<Images> }> = {};
  let error: Error | {} | string | undefined | null = null;
  const testScope: string[] = [];

  function runHandler(failures: number): void {
    if (process.send) {
      if (failures > 0) {
        const isTimeout = typeof error == 'string' && error.toLowerCase().includes('timeout');
        process.send(
          JSON.stringify({ type: isTimeout ? 'error' : 'test', payload: { status: 'failed', images, error } }),
        );
      } else {
        process.send(JSON.stringify({ type: 'test', payload: { status: 'success', images } }));
      }
    }
    // TODO Should we move into `process.on`?
    images = {};
    error = null;
  }

  async function getExpected(
    imageName?: string,
  ): Promise<
    { expected: Buffer | null; onCompare: (actual: Buffer, expect?: Buffer, diff?: Buffer) => void } | Buffer | null
  > {
    // context => [kind, story, test, browser]
    // rootSuite -> kindSuite -> storyTest -> [browsers.png]
    // rootSuite -> kindSuite -> storySuite -> test -> [browsers.png]
    const testPath = [...testScope];
    if (!imageName) imageName = testPath.pop() as string;

    const image = (images[imageName] = images[imageName] || {});
    const reportImageDir = path.join(config.reportDir, ...testPath);
    const imageNumber = (await getLastImageNumber(reportImageDir, imageName)) + 1;
    const onCompare = async (actual: Buffer, expect?: Buffer, diff?: Buffer): Promise<void> => {
      image.actual = `${imageName}-actual-${imageNumber}.png`;
      await mkdirAsync(reportImageDir, { recursive: true });
      await writeFileAsync(path.join(reportImageDir, image.actual), actual);

      if (!diff || !expect) return;

      image.expect = `${imageName}-expect-${imageNumber}.png`;
      image.diff = `${imageName}-diff-${imageNumber}.png`;
      await writeFileAsync(path.join(reportImageDir, image.expect), expect);
      await writeFileAsync(path.join(reportImageDir, image.diff), diff);
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    //@ts-ignore Should update @types/mocha for new major release https://github.com/mochajs/mocha/releases/tag/v7.0.0
    reporterOption: {
      reportDir: config.reportDir,
      topLevelSuite: options.browser,
      willRetry: () => retries < config.maxRetries,
      images: () => images,
    },
  };
  const mocha = new Mocha(mochaOptions);

  // TODO Move to beforeAll
  chai.use(chaiImage(getExpected, config.diffOptions));
  addTestsFromStories(
    mocha.suite,
    options.browser,
    await loadStories(config.storybookDir, config.enableFastStoriesLoading),
  );

  const browserConfig = config.browsers[options.browser] as BrowserConfig;
  const browser = await getBrowser(config, browserConfig);

  setInterval(() => {
    browser
      .getCurrentUrl()
      .then(url =>
        console.log(chalk`[{blue WORKER}{grey :${options.browser}:${process.pid}}] {grey current url} ${url}`),
      );
  }, 10 * 1000);

  mocha.suite.beforeAll(function(this: Context) {
    this.config = config;
    this.browser = browser;
    this.browserName = options.browser;
    this.testScope = testScope;
  });
  // TODO Handle story context
  mocha.suite.beforeEach(switchStory);
  patchMochaInterface(mocha.suite);

  process.on('message', message => {
    const test: { id: string; path: string[]; retries: number } = JSON.parse(message);
    retries = test.retries;
    const testPath = [...test.path]
      .reverse()
      .join(' ')
      .replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');

    mocha.grep(new RegExp(`^${testPath}$`));
    const runner = mocha.run(runHandler);

    // TODO How handle browser corruption?
    runner.on('fail', (_test, reason) => (error = reason instanceof Error ? reason.stack || reason.message : reason));
  });

  console.log('[CreeveyWorker]:', `Ready ${options.browser}:${process.pid}`);

  if (process.send) {
    process.send(JSON.stringify({ type: 'ready' }));
  }
}
