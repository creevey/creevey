import chalk from 'chalk';
import { networkInterfaces } from 'os';
import { logger } from './logger.js';
import type { Args } from 'storybook/internal/types';
import {
  isDefined,
  StoryInput,
  BaseCreeveyTestContext,
  CreeveyTestContext,
  CreeveyStoryParams,
  StoriesRaw,
  CreeveyWebdriver,
  ServerTest,
} from '../types.js';

export const storybookRootID = 'storybook-root';
export const LOCALHOST_REGEXP = /(localhost|127\.0\.0\.1)/i;
const DOCKER_INTERNAL = 'host.docker.internal';

export async function resolveStorybookUrl(
  storybookUrl: string,
  checkUrl: (url: string) => Promise<boolean>,
): Promise<string> {
  logger().debug('Resolving storybook url');
  const addresses = getAddresses();
  // TODO Use Promise.race?
  for (const ip of addresses) {
    const resolvedUrl = storybookUrl.replace(LOCALHOST_REGEXP, ip);
    logger().debug(`Checking storybook availability on ${chalk.magenta(resolvedUrl)}`);
    if (await checkUrl(resolvedUrl)) {
      logger().debug(`Resolved storybook url ${chalk.magenta(resolvedUrl)}`);
      return resolvedUrl;
    }
  }
  const error = new Error('Please specify `storybookUrl` with IP address that accessible from remote browser');
  error.name = 'ResolveUrlError';
  throw error;
}

export function appendIframePath(url: string): string {
  return `${url.replace(/\/$/, '')}/iframe.html`;
}

export function getAddresses(): string[] {
  // TODO Check if docker is used
  return [DOCKER_INTERNAL].concat(
    ...Object.values(networkInterfaces())
      .filter(isDefined)
      .map((network) => network.filter((info) => info.family == 'IPv4').map((info) => info.address)),
  );
}

export abstract class CreeveyWebdriverBase implements CreeveyWebdriver {
  protected abstract takeScreenshot(
    captureElement: string | null,
    ignoreElements?: string | string[] | null,
  ): Promise<Buffer>;

  protected abstract selectStory(id: string): Promise<void>;

  protected abstract updateStoryArgs(story: StoryInput, updatedArgs: Args): Promise<void>;

  abstract getSessionId(): Promise<string>;

  abstract openBrowser(fresh?: boolean): Promise<CreeveyWebdriver | null>;

  abstract closeBrowser(): Promise<void>;

  abstract loadStoriesFromBrowser(): Promise<StoriesRaw>;

  abstract afterTest(test: ServerTest): Promise<void>;

  async switchStory(story: StoryInput, context: BaseCreeveyTestContext): Promise<CreeveyTestContext> {
    const { id, title, name, parameters } = story;
    const { captureElement = `#${storybookRootID}`, ignoreElements } = (parameters.creevey ?? {}) as CreeveyStoryParams;

    logger().debug(`Switching to story ${chalk.cyan(title)}/${chalk.cyan(name)} by id ${chalk.magenta(id)}`);

    await this.selectStory(id);

    return Object.assign(
      {
        takeScreenshot: () => this.takeScreenshot(captureElement, ignoreElements),
        updateStoryArgs: (updatedArgs: Args) => this.updateStoryArgs(story, updatedArgs),
        captureElement,
      },
      context,
    );
  }
}
