import path from 'path';
import { config as dotenv } from 'dotenv';
import { isInsideDocker } from '../src/server/utils';
import { CreeveyConfig } from '../src/types';

dotenv();

const config: CreeveyConfig = {
  useDocker: isInsideDocker ? false : true,
  maxRetries: process.env.CI ? 5 : 0,
  screenDir: path.join(__dirname, '../stories/images'),
};

export default config;
