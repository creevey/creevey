import fs from 'fs';
import path from 'path';
import cluster from 'cluster';
import { pathToFileURL } from 'url';
import { loadStories as hybridStoriesProvider } from './providers/hybrid.js';
import { Config, BrowserConfig, BrowserConfigObject, Options, isDefined } from '../types.js';
import { configExt, loadThroughTSX } from './utils.js';
import { CreeveyReporter, TeamcityReporter } from './reporter.js';
import { logger } from './logger.js';

export const defaultBrowser = 'chrome';

export const defaultConfig: Omit<Config, 'gridUrl' | 'tsConfig' | 'webdriver'> = {
  disableTelemetry: false,
  useWorkerQueue: false,
  useDocker: true,
  dockerImage: 'aerokube/selenoid:latest-release', // TODO What about playwright?
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

export async function readConfig(options: Options): Promise<Config> {
  const configPath = resolveConfigPath(options.config);
  const userConfig: typeof defaultConfig & Partial<Pick<Config, 'gridUrl' | 'storiesProvider'>> = { ...defaultConfig };

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

    Object.assign(userConfig, configData);
  }

  if (userConfig.resolveStorybookUrl && !options.storybookUrl) {
    userConfig.storybookUrl = await userConfig.resolveStorybookUrl();
  }

  if (options.noDocker) userConfig.useDocker = false;
  if (options.failFast != undefined) userConfig.failFast = Boolean(options.failFast);
  if (options.reportDir) userConfig.reportDir = path.resolve(options.reportDir);
  if (options.screenDir) userConfig.screenDir = path.resolve(options.screenDir);
  if (options.storybookUrl) userConfig.storybookUrl = options.storybookUrl;
  if (options.storybookPort && cluster.isPrimary) {
    const url = new URL(userConfig.storybookUrl);
    url.port = options.storybookPort;
    userConfig.storybookUrl = url.toString();
  }
  if (typeof options.storybookStart === 'string') userConfig.storybookAutorunCmd = options.storybookStart;

  if (options.storybookStart && cluster.isPrimary) {
    const { default: getPort } = await import('get-port');
    const url = new URL(userConfig.storybookUrl);
    const port = await getPort({ port: Number(url.port) });
    url.port = `${port}`;
    userConfig.storybookUrl = url.toString();
  }

  // NOTE: Hack to pass typescript checking
  const config = userConfig as Config;

  Object.entries(config.browsers).forEach(
    ([browser, browserConfig]) => (config.browsers[browser] = normalizeBrowserConfig(browser, browserConfig)),
  );

  return config;
}
