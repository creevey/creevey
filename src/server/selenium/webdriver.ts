/// <reference types="../../../types/selenium-context" />
import type { Args } from 'storybook/internal/types';
import { Config, StorybookGlobals, StoryInput, StoriesRaw, Options, ServerTest } from '../../types.js';
import { subscribeOn } from '../messages.js';
import { CreeveyWebdriverBase } from '../webdriver.js';
import type { InternalBrowser } from './internal.js';
import { logger } from '../logger.js';
import { removeWorkerContainer } from '../worker/context.js';

declare global {
  interface Window {
    __CREEVEY_RESTORE_SCROLL__?: () => void;
    __CREEVEY_UPDATE_GLOBALS__: (globals: StorybookGlobals) => void;
    __CREEVEY_INSERT_IGNORE_STYLES__: (ignoreElements: string[]) => HTMLStyleElement;
    __CREEVEY_REMOVE_IGNORE_STYLES__: (ignoreStyles: HTMLStyleElement) => void;
  }
}

// TODO Update context interface through references
export class SeleniumWebdriver extends CreeveyWebdriverBase {
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
      void this.#browser?.closeBrowser().finally(() => {
        void removeWorkerContainer().finally(() => process.exit());
      });
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

    return this.#browser.browser.getSession().then((session) => session.getId());
  }

  async openBrowser(fresh = false): Promise<SeleniumWebdriver | null> {
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
      throw new Error('Browser is not initialized');
    }

    return this.#browser.loadStoriesFromBrowser();
  }

  afterTest(test: ServerTest): Promise<void> {
    if (!this.#browser) {
      throw new Error('Browser is not initialized');
    }

    return this.#browser.afterTest(test);
  }

  protected async takeScreenshot(
    captureElement: string | null,
    ignoreElements?: string | string[] | null,
  ): Promise<Buffer> {
    if (!this.#browser) {
      throw new Error('Browser is not initialized');
    }

    return this.#browser.takeScreenshot(captureElement, ignoreElements);
  }

  protected waitForComplete(callback: (isCompleted: boolean) => void): void {
    if (!this.#browser) {
      throw new Error('Browser is not initialized');
    }

    this.#browser.waitForComplete(callback);
  }

  protected async selectStory(id: string, waitForReady?: boolean): Promise<boolean> {
    if (!this.#browser) {
      throw new Error('Browser is not initialized');
    }

    return this.#browser.selectStory(id, waitForReady);
  }

  protected async updateStoryArgs(story: StoryInput, updatedArgs: Args): Promise<void> {
    if (!this.#browser) {
      throw new Error('Browser is not initialized');
    }

    return this.#browser.updateStoryArgs(story, updatedArgs);
  }
}
