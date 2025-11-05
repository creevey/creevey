/// <reference types="../../../types/playwright-context" />
import type { Args } from 'storybook/internal/types';
import type { Config, StoriesRaw, StoryInput } from '../../types';
import { logger } from '../logger';
import { subscribeOn } from '../messages';
import { CreeveyWebdriverBase } from '../webdriver';
import type { InternalBrowser } from './internal';
import { PageScreenshotOptions } from 'playwright-core';

export class PlaywrightWebdriver extends CreeveyWebdriverBase {
  #browser: InternalBrowser | null = null;
  #browserName: string;
  #gridUrl: string;
  #config: Config;
  #debug: boolean;
  constructor(browser: string, gridUrl: string, config: Config, debug: boolean) {
    super();

    this.#browserName = browser;
    this.#gridUrl = gridUrl;
    this.#config = config;
    this.#debug = debug;

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
        logger().error(error);
        return null;
      }
    })();

    if (!internalModule) return null;

    const { InternalBrowser } = internalModule;
    const browser = await InternalBrowser.getBrowser(this.#browserName, this.#gridUrl, this.#config, this.#debug);

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
      throw new Error('Browser is not initialized');
    }

    return this.#browser.loadStoriesFromBrowser();
  }

  async watchStoriesForChanges(port: number): Promise<void> {
    if (!this.#browser) {
      throw new Error('Browser is not initialized');
    }

    return this.#browser.watchStoriesForChanges(port);
  }

  afterTest(): Promise<void> {
    return Promise.resolve(undefined);
  }

  protected async takeScreenshot(
    captureElement: string | null,
    ignoreElements?: string | string[] | null,
    options?: PageScreenshotOptions,
  ): Promise<Buffer> {
    if (!this.#browser) {
      throw new Error('Browser is not initialized');
    }

    return this.#browser.takeScreenshot(captureElement, ignoreElements, options);
  }

  protected async selectStory(id: string): Promise<void> {
    if (!this.#browser) {
      throw new Error('Browser is not initialized');
    }

    return this.#browser.selectStory(id);
  }

  protected async updateStoryArgs(story: StoryInput, updatedArgs: Args): Promise<void> {
    if (!this.#browser) {
      throw new Error('Browser is not initialized');
    }

    return this.#browser.updateStoryArgs(story, updatedArgs);
  }
}
