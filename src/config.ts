import fs from 'fs';
import path from 'path';
import { extensions, Extension } from 'interpret';
import { Context } from 'mocha';
import { switchStory, getBrowser } from './utils';
import { Config, Browser, BrowserConfig, Options } from './types';

export const defaultConfig: Omit<Config, 'gridUrl' | 'testDir'> = {
  storybookUrl: 'http://localhost:6006',
  testRegex: /\.(t|j)s$/,
  screenDir: path.resolve('images'),
  reportDir: path.resolve('report'),
  maxRetries: 0,
  threshold: 0,
  browsers: { chrome: true },
};

function registerCompiler(moduleDescriptor: Extension | null): void {
  if (moduleDescriptor) {
    if (typeof moduleDescriptor === 'string') {
      require(moduleDescriptor);
    } else if (!Array.isArray(moduleDescriptor)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      moduleDescriptor.register(require(moduleDescriptor.module));
    } else {
      moduleDescriptor.find(extension => {
        try {
          registerCompiler(extension);
          return true;
        } catch (e) {
          // do nothing
        }
      });
    }
  }
}

function normalizeBrowserConfig(name: string, config: Browser): BrowserConfig {
  if (typeof config == 'boolean') return { browserName: name };
  if (typeof config == 'string') return { browserName: config };
  return config;
}

export function readConfig(configPath: string, options: Options): Config {
  const userConfig: typeof defaultConfig & Partial<Pick<Config, 'gridUrl'>> = { ...defaultConfig };

  if (fs.existsSync(require.resolve(configPath))) {
    try {
      require(configPath);
    } catch (e) {
      let ext = path.extname(configPath);
      if (ext == '.config') {
        ext = Object.keys(extensions).find(key => fs.existsSync(`${configPath}${key}`)) || ext;
      }
      registerCompiler(extensions[ext]);
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const configModule = require(configPath);
    Object.assign(userConfig, configModule && configModule.__esModule ? configModule.default : configModule);
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

  if (!config.hooks) {
    config.hooks = {
      async beforeAll(this: Context) {
        const { config, browserName } = this;
        const browserConfig = config.browsers[browserName] as BrowserConfig;
        this.browser = await getBrowser(config, browserConfig);
      },
      beforeEach: switchStory,
    };
  }

  return config;
}
