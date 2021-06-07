import fs from 'fs';
import path from 'path';
import { isStorybookVersionLessThan, storybookDirRef } from './storybook/helpers';
import { Config, Browser, BrowserConfig, Options, isDefined } from '../types';

export const defaultBrowser = 'chrome';

export const defaultConfig: Omit<Config, 'gridUrl'> = {
  useDocker: true,
  useWebpackToExtractTests: false,
  dockerImage: 'aerokube/selenoid:latest-release',
  pullImages: true,
  storybookUrl: 'http://localhost:6006',
  screenDir: path.resolve('images'),
  reportDir: path.resolve('report'),
  storybookDir: path.resolve('.storybook'),
  maxRetries: 0,
  diffOptions: { threshold: 0, includeAA: true },
  browsers: { [defaultBrowser]: true },
  hooks: {},
  babelOptions: (_) => _,
};

function normalizeBrowserConfig(name: string, config: Browser): BrowserConfig {
  if (typeof config == 'boolean') return { browserName: name };
  if (typeof config == 'string') return { browserName: config };
  return config;
}

function resolveConfigPath(configPath?: string): string | undefined {
  const rootDir = process.cwd();
  const configDir = path.resolve('.creevey');

  if (isDefined(configPath)) {
    configPath = path.resolve(configPath);
  } else if (fs.existsSync(configDir)) {
    configPath = path.join(configDir, 'config');
    // TODO We already find file with extension, why not use it?
  } else if (fs.readdirSync(rootDir).find((filename) => filename.startsWith('creevey.config'))) {
    configPath = path.join(rootDir, 'creevey.config');
  }

  return configPath;
}

export async function readConfig(options: Options): Promise<Config> {
  const configPath = resolveConfigPath(options.config);
  const userConfig: typeof defaultConfig & Partial<Pick<Config, 'gridUrl'>> = { ...defaultConfig };

  if (isDefined(configPath)) Object.assign(userConfig, ((await import(configPath)) as { default: Config }).default);
  if (isStorybookVersionLessThan(6, 2)) userConfig.useWebpackToExtractTests = true;

  if (options.reportDir) userConfig.reportDir = path.resolve(options.reportDir);
  if (options.screenDir) userConfig.screenDir = path.resolve(options.screenDir);

  // NOTE: Hack to pass typescript checking
  const config = userConfig as Config;

  Object.entries(config.browsers).forEach(
    ([browser, browserConfig]) => (config.browsers[browser] = normalizeBrowserConfig(browser, browserConfig)),
  );

  storybookDirRef.current = config.storybookDir;

  return config;
}
