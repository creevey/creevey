import path from 'path';
import { isInsideDocker } from '../src/server/utils';
import { CreeveyConfig } from '../src/types';

const config: CreeveyConfig = {
  useDocker: isInsideDocker ? false : true,
  maxRetries: process.env.CI ? 1 : 0,
  screenDir: path.join(__dirname, '../stories/images'),
};

export default config;
