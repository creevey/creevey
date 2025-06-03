import path from 'path';
import { config as dotenv } from 'dotenv';
import { PlaywrightWebdriver } from '../src/playwright.js';
import { isInsideDocker } from '../src/server/utils.js';
import { CreeveyConfig } from '../src/types.js';
import { fileURLToPath, pathToFileURL } from 'url';

dotenv();

const importMetaUrl = pathToFileURL(__filename).href;

const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver,
  useDocker: !isInsideDocker,
  maxRetries: process.env.CI ? 5 : 0,
  screenDir: path.join(path.dirname(fileURLToPath(importMetaUrl)), '../stories/images'),
};

export default config;
