import { exec } from 'shelljs';
import type { Config, Options } from '../types';
import { waitOnUrl } from './utils.js';
import { logger } from './logger.js';

const RESPONSE_FAST_CHECK_TIMEOUT_MS = 3000;
const RESPONSE_CHECK_TIMEOUT_MS = 10000;
const RESPONSE_CHECK_INTERVAL_MS = 200;

export function getStorybookUrl(
  { storybookUrl, storybookAutorunCmd }: Config,
  { startStorybook }: Options,
): [string | undefined, string] {
  if (storybookAutorunCmd || startStorybook) {
    const url = new URL(storybookUrl);
    url.hostname = 'localhost';
    return [url.toString(), storybookUrl];
  }
  return [undefined, storybookUrl];
}

export async function tryAutorunStorybook(url: string, storybookAutorunCmd: string) {
  try {
    await waitOnUrl(url, RESPONSE_FAST_CHECK_TIMEOUT_MS, RESPONSE_CHECK_INTERVAL_MS);
  } catch {
    logger().info(`Trying start Storybook automatically via \`${storybookAutorunCmd}\` from config...`);
    exec(storybookAutorunCmd, { async: true });
  }
}

export async function checkIsStorybookConnected(url: string) {
  try {
    await waitOnUrl(url, RESPONSE_CHECK_TIMEOUT_MS, RESPONSE_CHECK_INTERVAL_MS);
    return true;
  } catch (reason: unknown) {
    const error = reason instanceof Error ? (reason.stack ?? reason.message) : (reason as string);
    logger().error(error);
    return false;
  }
}
