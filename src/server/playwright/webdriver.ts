/// <reference types="../../../types/playwright-context" />
import { Args } from '@storybook/csf';
import { Config, Options, ServerTest, StoriesRaw, StoryInput } from '../../types';
import { logger } from '../logger';
import { subscribeOn } from '../messages';
import { CreeveyWebdriverBase } from '../webdriver';
import type { InternalBrowser } from './internal';

export class PlaywrightWebdriver extends CreeveyWebdriverBase {
  #browser: InternalBrowser | null = null;
  #browserName: string;
  #gridUrl: string;
  #config: Config;
  #options: Options;
  constructor(browser: string, gridUrl: string, config: Config, options: Options) {
    super();

    this.#browserName = browser;
    this.#gridUrl = gridUrl;
    this.#config = config;
    this.#options = options;

    subscribeOn('shutdown', () => {
      void this.#browser?.closeBrowser().finally(() => process.exit());
      this.#browser = null;
    });
  }

  get browser() {
    return this.#browser?.browser;
  }

  getSessionId(): Promise<string> {
    if (!this.#browser) {
      // TODO Describe the error
      throw new Error('Browser is not initialized');
    }

    return Promise.resolve(this.#browser.sessionId);
  }

  async openBrowser(fresh = false): Promise<PlaywrightWebdriver | null> {
    if (this.#browser) {
      if (fresh) {
        await this.#browser.closeBrowser();
        this.#browser = null;
      } else {
        return this;
      }
    }

    const internalModule = await (async () => {
      try {
        return await import('./internal.js');
      } catch (error) {
        logger.error(error);
        return null;
      }
    })();

    if (!internalModule) return null;

    const { InternalBrowser } = internalModule;
    const browser = await InternalBrowser.getBrowser(this.#browserName, this.#gridUrl, this.#config, this.#options);

    if (!browser) return null;

    this.#browser = browser;

    return this;
  }

  async closeBrowser(): Promise<void> {
    if (this.#browser) {
      await this.#browser.closeBrowser();
      this.#browser = null;
    }
  }

  async loadStoriesFromBrowser(): Promise<StoriesRaw> {
    if (!this.#browser) {
      // TODO Describe the error
      throw new Error('Browser is not initialized');
    }

    return this.#browser.loadStoriesFromBrowser();
  }

  afterTest(_test: ServerTest): Promise<void> {
    return Promise.resolve(undefined);
  }

  protected async takeScreenshot(
    captureElement: string | null,
    ignoreElements?: string | string[] | null,
  ): Promise<Buffer> {
    if (!this.#browser) {
      // TODO Describe the error
      throw new Error('Browser is not initialized');
    }

    return this.#browser.takeScreenshot(captureElement, ignoreElements);
  }

  protected waitForComplete(callback: (isCompleted: boolean) => void): void {
    if (!this.#browser) {
      // TODO Describe the error
      throw new Error('Browser is not initialized');
    }

    this.#browser.waitForComplete(callback);
  }

  protected async selectStory(id: string, waitForReady?: boolean): Promise<boolean> {
    if (!this.#browser) {
      // TODO Describe the error
      throw new Error('Browser is not initialized');
    }

    return this.#browser.selectStory(id, waitForReady);
  }

  protected async updateStoryArgs(story: StoryInput, updatedArgs: Args): Promise<void> {
    if (!this.#browser) {
      // TODO Describe the error
      throw new Error('Browser is not initialized');
    }

    return this.#browser.updateStoryArgs(story, updatedArgs);
  }
}
