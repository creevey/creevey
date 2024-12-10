import { Config } from 'src/types';
import { waitOnUrl } from '../utils';
import { logger } from '../logger';
import { exec } from 'node:child_process';

const RESPONSE_FAST_CHECK_TIMEOUT_MS = 3000;
const RESPONSE_CHECK_TIMEOUT_MS = 10000;
const RESPONSE_CHECK_INTERVAL_MS = 200;

export async function tryAutorunStorybook({ storybookAutorunCmd, storybookUrl }: Config) {
  if (!storybookAutorunCmd) {
    return;
  }

  try {
    await waitOnUrl(storybookUrl, RESPONSE_FAST_CHECK_TIMEOUT_MS, RESPONSE_CHECK_INTERVAL_MS);
  } catch {
    logger().info(`Trying start Storybook automatically via \`${storybookAutorunCmd}\` from config...`);
    exec(storybookAutorunCmd);
  }
}

export async function checkIsStorybookConnected({ storybookUrl }: Config) {
  try {
    await waitOnUrl(storybookUrl, RESPONSE_CHECK_TIMEOUT_MS, RESPONSE_CHECK_INTERVAL_MS);
    return true;
  } catch (reason: unknown) {
    const error = reason instanceof Error ? (reason.stack ?? reason.message) : (reason as string);
    logger().error(error);
    return false;
  }
}
