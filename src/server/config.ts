import fs from 'fs';
import path from 'path';
import cluster from 'cluster';
import { pathToFileURL } from 'url';
import * as v from 'valibot';
import { loadStories as hybridStoriesProvider } from './providers/hybrid.js';
import { Config, BrowserConfig, BrowserConfigObject, isDefined } from '../types.js';
import { OptionsSchema, Options, WorkerOptions } from '../schema.js';
import { configExt, loadThroughTSX } from './utils.js';
import { CreeveyReporter } from './reporters/creevey.js';
import { TeamcityReporter } from './reporters/teamcity.js';
import { logger } from './logger.js';

export const defaultBrowser = 'chrome';

export const defaultConfig: Omit<Config, 'gridUrl' | 'tsConfig' | 'webdriver'> = {
  disableTelemetry: false,
  useWorkerQueue: false,
  useDocker: true,
  dockerImage: 'aerokube/selenoid:latest', // TODO What about playwright?
  dockerImagePlatform: '',
  pullImages: true,
  failFast: false,
  storybookUrl: 'http://localhost:6006',
  screenDir: path.resolve('images'),
  reportDir: path.resolve('report'),
  testsDir: path.resolve('src'),
  reporter: process.env.TEAMCITY_VERSION ? TeamcityReporter : CreeveyReporter,
  storiesProvider: hybridStoriesProvider,
  maxRetries: 0,
  testTimeout: 30000,
  diffOptions: { threshold: 0.1, includeAA: false },
  odiffOptions: { threshold: 0.1, antialiasing: true },
  browsers: { [defaultBrowser]: true },
  hooks: {},
  testsRegex: /\.creevey\.(m|c)?(t|j)s$/,
};

function normalizeBrowserConfig(name: string, config: BrowserConfig): BrowserConfigObject {
  if (typeof config == 'boolean') return { browserName: name };
  if (typeof config == 'string') return { browserName: config };
  return config;
}

function resolveConfigPath(configPath?: string): string | undefined {
  const configDir = path.resolve('.creevey');

  if (isDefined(configPath)) {
    configPath = path.resolve(configPath);
  } else if (fs.existsSync(configDir)) {
    for (const ext of configExt) {
      configPath = path.resolve(configDir, `config${ext}`);
      if (fs.existsSync(configPath)) break;
    }
  } else {
    for (const ext of configExt) {
      configPath = path.resolve(`creevey.config${ext}`);
      if (fs.existsSync(configPath)) break;
    }
  }

  return configPath;
}

export async function readConfig(options: Options | WorkerOptions): Promise<Config> {
  const configPath = resolveConfigPath(options.config);
  const userConfig: typeof defaultConfig & Partial<Pick<Config, 'gridUrl' | 'storiesProvider'>> = { ...defaultConfig };
  let hasExplicitStoriesProvider = false;

  if (isDefined(configPath)) {
    const configModule = await loadThroughTSX<
      { default: { default: Partial<Config> } | Partial<Config> } | Partial<Config>
    >((load) => {
      const configFileUrl = pathToFileURL(configPath).toString();
      return load(configFileUrl);
    });
    let configData = 'default' in configModule ? configModule.default : configModule;
    // NOTE In node > 18 with commonjs project and esm config with tsconfig moduleResolution nodeNext there is additional 'default'
    configData = 'default' in configData ? configData.default : configData;

    if (!configData.webdriver) {
      const { SeleniumWebdriver } = await import('./selenium/webdriver.js');
      logger().warn(
        "Creevey supports `Selenium` and `Playwright` webdrivers. For backward compatibility `Selenium` is used by default, but it might changed in the future. Please explicitly specify one of webdrivers in your Creevey's config",
      );
      configData.webdriver = SeleniumWebdriver;
    }

    for (const key in configData) {
      const configKey = key as keyof typeof configData;
      if (configData[configKey] === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete configData[configKey];
      }
    }

    if ('storiesProvider' in configData) {
      hasExplicitStoriesProvider = true;
    }
    Object.assign(userConfig, configData);
  }

  if (userConfig.resolveStorybookUrl && !options.storybookUrl) {
    userConfig.storybookUrl = await userConfig.resolveStorybookUrl();
  }

  if (options.reportDir) userConfig.reportDir = path.resolve(options.reportDir);
  if (options.screenDir) userConfig.screenDir = path.resolve(options.screenDir);
  if (options.storybookUrl) userConfig.storybookUrl = options.storybookUrl;

  if (v.is(OptionsSchema, options)) {
    if (options.docker === false) userConfig.useDocker = false;
    if (options.failFast != undefined) userConfig.failFast = Boolean(options.failFast);
    if (cluster.isPrimary) {
      if (options.storybookPort) {
        const url = new URL(userConfig.storybookUrl);
        url.port = `${options.storybookPort}`;
        userConfig.storybookUrl = url.toString();
      }
      if (typeof options.storybookStart === 'string') userConfig.storybookAutorunCmd = options.storybookStart;
      else if (options.storybookStart) {
        const { default: getPort } = await import('get-port');
        const url = new URL(userConfig.storybookUrl);
        const port = await getPort({ port: Number(url.port) });
        url.port = `${port}`;
        userConfig.storybookUrl = url.toString();
      }
    }
  }

  if (!path.isAbsolute(userConfig.reportDir)) {
    userConfig.reportDir = path.resolve(userConfig.reportDir);
  }
  if (!path.isAbsolute(userConfig.screenDir)) {
    userConfig.screenDir = path.resolve(userConfig.screenDir);
  }
  if (userConfig.testsDir && !path.isAbsolute(userConfig.testsDir)) {
    userConfig.testsDir = path.resolve(userConfig.testsDir);
  }

  // NOTE: Hack to pass typescript checking
  const config = userConfig as Config;

  Object.entries(config.browsers).forEach(
    ([browser, browserConfig]) => (config.browsers[browser] = normalizeBrowserConfig(browser, browserConfig)),
  );

  // Check if browserStoriesProvider is explicitly set and add deprecation warning
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  if (hasExplicitStoriesProvider && config.storiesProvider.providerName === 'browser') {
    logger().warn(
      'The `browserStoriesProvider` is deprecated and will be removed in a future version. ' +
        'Creevey will use only the `hybrid` stories provider going forward. ' +
        'Please remove the `storiesProvider` property from your config as `hybridStoriesProvider` is already the default.',
    );
  }

  return config;
}
