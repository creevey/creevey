import path from 'path';
import { config as dotenv } from 'dotenv';
import { PlaywrightWebdriver } from '../src/playwright.js';
import { isInsideDocker } from '../src/server/utils.js';
import { CreeveyConfig } from '../src/types.js';
import { fileURLToPath } from 'url';

dotenv();

const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver,
  useDocker: isInsideDocker ? false : true,
  maxRetries: process.env.CI ? 5 : 0,
  screenDir: path.join(path.dirname(fileURLToPath(import.meta.url)), '../stories/images'),
};

export default config;
