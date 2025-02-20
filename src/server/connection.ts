import type { Config, Options } from '../types';
import { waitOnUrl } from './utils.js';
import { logger } from './logger.js';

const RESPONSE_CHECK_TIMEOUT_MS = 10000;
const RESPONSE_CHECK_INTERVAL_MS = 200;

export function getStorybookUrl({ storybookUrl }: Config, { storybookStart }: Options): [string, string | undefined] {
  if (storybookStart) {
    const url = new URL(storybookUrl);
    url.hostname = 'localhost';
    return [url.toString(), storybookUrl];
  }
  return [storybookUrl, undefined];
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
