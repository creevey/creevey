import fs from 'fs';
import path from 'path';
import { Config, Browser, BrowserConfig, Options, isDefined } from './types';
import { requireConfig } from './utils';

export const defaultConfig: Omit<Config, 'gridUrl'> = {
  storybookUrl: 'http://localhost:6006',
  screenDir: path.resolve('images'),
  reportDir: path.resolve('report'),
  storybookDir: path.resolve('.storybook'),
  enableFastStoriesLoading: false,
  maxRetries: 0,
  diffOptions: { threshold: 0, includeAA: true },
  browsers: { chrome: true },
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

export function readConfig(options: Options): Config {
  const configPath = resolveConfigPath(options.config);
  const userConfig: typeof defaultConfig & Partial<Pick<Config, 'gridUrl'>> = { ...defaultConfig };

  if (isDefined(configPath)) Object.assign(userConfig, requireConfig<Config>(configPath));

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
