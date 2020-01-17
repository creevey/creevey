import fs from 'fs';
import path from 'path';
import { Config, Browser, BrowserConfig, Options } from './types';
import { requireConfig } from './utils';

export const defaultConfig: Omit<Config, 'gridUrl'> = {
  storybookUrl: 'http://localhost:6006',
  screenDir: path.resolve('images'),
  reportDir: path.resolve('report'),
  storybookDir: path.resolve('.storybook'),
  enableFastStoriesLoading: false,
  maxRetries: 0,
  threshold: 0,
  browsers: { chrome: true },
};

function normalizeBrowserConfig(name: string, config: Browser): BrowserConfig {
  if (typeof config == 'boolean') return { browserName: name };
  if (typeof config == 'string') return { browserName: config };
  return config;
}

export function readConfig(configPath: string, options: Options): Config {
  const userConfig: typeof defaultConfig & Partial<Pick<Config, 'gridUrl'>> = { ...defaultConfig };

  if (fs.existsSync(require.resolve(configPath))) {
    Object.assign(userConfig, requireConfig<Config>(configPath));
  }

  if (options.gridUrl) userConfig.gridUrl = options.gridUrl;
  if (options.reportDir) userConfig.reportDir = path.resolve(options.reportDir);
  if (options.screenDir) userConfig.screenDir = path.resolve(options.screenDir);

  const { gridUrl } = userConfig;

  if (!gridUrl) {
    console.log('Please specify `gridUrl`');
    process.exit(-1);
  }

  // NOTE: Hack to pass typescript checking
  const config: Config = { ...userConfig, gridUrl };

  Object.entries(config.browsers).forEach(
    ([browser, browserConfig]) => (config.browsers[browser] = normalizeBrowserConfig(browser, browserConfig)),
  );

  return config;
}
