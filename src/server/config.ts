import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { loadStories as browserStoriesProvider } from './providers/browser.js';
import { Config, BrowserConfig, BrowserConfigObject, Options, isDefined } from '../types.js';
import { configExt, loadThroughTSX } from './utils.js';
import { CreeveyReporter, TeamcityReporter } from './reporter.js';
import { SeleniumWebdriver } from './selenium/webdriver.js';

export const defaultBrowser = 'chrome';

export const defaultConfig: Omit<Config, 'gridUrl' | 'testsDir' | 'tsConfig'> = {
  disableTelemetry: false,
  useWorkerQueue: false,
  useDocker: true,
  dockerImage: 'aerokube/selenoid:latest-release',
  dockerImagePlatform: '',
  pullImages: true,
  failFast: false,
  storybookUrl: 'http://localhost:6006',
  screenDir: path.resolve('images'),
  reportDir: path.resolve('report'),
  reporter: process.env.TEAMCITY_VERSION ? TeamcityReporter : CreeveyReporter,
  storiesProvider: browserStoriesProvider,
  webdriver: SeleniumWebdriver,
  maxRetries: 0,
  testTimeout: 30000,
  diffOptions: { threshold: 0.05, includeAA: false },
  odiffOptions: { threshold: 0.05, antialiasing: true },
  browsers: { [defaultBrowser]: true },
  hooks: {},
  testsRegex: /\.creevey\.(t|j)s$/,
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
    const configModule = await loadThroughTSX<{ default: Partial<Config> } | Partial<Config>>((load) => {
      const configFileUrl = pathToFileURL(configPath).toString();
      return load(configFileUrl);
    });
    const configData = 'default' in configModule ? configModule.default : configModule;

    Object.assign(userConfig, configData);
  }

  if (options.failFast != undefined) userConfig.failFast = Boolean(options.failFast);
  if (options.reportDir) userConfig.reportDir = path.resolve(options.reportDir);
  if (options.screenDir) userConfig.screenDir = path.resolve(options.screenDir);
  if (options.storybookUrl) userConfig.storybookUrl = options.storybookUrl;
  if (options.storybookAutorunCmd) userConfig.storybookAutorunCmd = options.storybookAutorunCmd;

  // NOTE: Hack to pass typescript checking
  const config = userConfig as Config;

  Object.entries(config.browsers).forEach(
    ([browser, browserConfig]) => (config.browsers[browser] = normalizeBrowserConfig(browser, browserConfig)),
  );

  return config;
}
