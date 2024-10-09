import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { loadStories as browserStoriesProvider } from './storybook/providers/browser.js';
import { Config, Browser, BrowserConfig, Options, isDefined } from '../types.js';
import { configExt, loadThroughTSX } from './utils.js';

export const defaultBrowser = 'chrome';

export const defaultConfig: Omit<Config, 'gridUrl' | 'storiesProvider' | 'testsDir' | 'tsConfig'> = {
  disableTelemetry: false,
  useDocker: true,
  dockerImage: 'aerokube/selenoid:latest-release',
  dockerImagePlatform: '',
  pullImages: true,
  failFast: false,
  storybookUrl: 'http://localhost:6006',
  screenDir: path.resolve('images'),
  reportDir: path.resolve('report'),
  maxRetries: 0,
  diffOptions: { threshold: 0, includeAA: true },
  browsers: { [defaultBrowser]: true },
  hooks: {},
  babelOptions: (_) => _,
  testsRegex: /\.creevey\.(t|j)s$/,
};

function normalizeBrowserConfig(name: string, config: Browser): BrowserConfig {
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

  if (!userConfig.storiesProvider) userConfig.storiesProvider = browserStoriesProvider;

  if (options.failFast != undefined) userConfig.failFast = Boolean(options.failFast);
  if (options.reportDir) userConfig.reportDir = path.resolve(options.reportDir);
  if (options.screenDir) userConfig.screenDir = path.resolve(options.screenDir);
  if (options.storybookUrl) userConfig.storybookUrl = options.storybookUrl;

  // NOTE: Hack to pass typescript checking
  const config = userConfig as Config;

  Object.entries(config.browsers).forEach(
    ([browser, browserConfig]) => (config.browsers[browser] = normalizeBrowserConfig(browser, browserConfig)),
  );

  return config;
}
