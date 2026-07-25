/// <reference types="../../../types/selenium-context" />
import type { Args } from 'storybook/internal/types';
import { Config, StoryInput, StoriesRaw } from '../../types.js';
import { subscribeOn } from '../messages.js';
import { CreeveyWebdriverBase } from '../webdriver.js';
import type { InternalBrowser } from './internal.js';
import { logger } from '../logger.js';
import { removeWorkerContainer } from '../worker/context.js';

/**
 * Idle probe threshold. The liveness probe in `ensureBrowser` is skipped if the
 * session was used within this window, making recovery free during continuous
 * test runs. Must stay comfortably below typical grid idle timeouts
 * (Selenoid ~60s, Selenium Grid 4 ~300s). Not configurable — rely on grid defaults.
 */
export const IDLE_PROBE_THRESHOLD = 30_000;

// TODO Update context interface through references
export class SeleniumWebdriver extends CreeveyWebdriverBase {
  #browser: InternalBrowser | null = null;
  #browserName: string;
  #gridUrl: string;
  #config: Config;
  #debug: boolean;
  #lastActivityAt = 0;

  constructor(browser: string, gridUrl: string, config: Config, debug: boolean) {
    super();

    this.#browserName = browser;
    this.#gridUrl = gridUrl;
    this.#config = config;
    this.#debug = debug;

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

  async ensureBrowser(): Promise<boolean> {
    if (!this.#browser) return false;
    if (Date.now() - this.#lastActivityAt < IDLE_PROBE_THRESHOLD) return false;

    this.#lastActivityAt = Date.now();

    try {
      // Cheap read-only command that round-trips to the grid; reveals a reaped session.
      await this.#browser.browser.getTitle();
      return false;
    } catch (error) {
      // Dynamic import preserves the optional-dependency lazy-load invariant.
      const { isSessionDeadError } = await import('./internal.js');
      if (!isSessionDeadError(error)) throw error;

      logger().info('Session appears dead; recreating...');
      // Reuses the existing close+rebuild+re-init path. openBrowser(true) discards
      // the dead InternalBrowser and builds a fresh one.
      if ((await this.openBrowser(true)) == null) {
        // Grid refused a new session; propagate so the worker's ensureBrowser
        // catch emits subtype:'unknown' and the master kill+refork path engages.
        throw new Error('Failed to recreate session after it was reaped by the grid');
      }
      this.#lastActivityAt = Date.now();
      return true;
    }
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
    const browser = await InternalBrowser.getBrowser(this.#browserName, this.#gridUrl, this.#config, this.#debug);

    if (!browser) return null;

    this.#browser = browser;
    this.#lastActivityAt = Date.now();

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

  async afterTest(): Promise<void> {
    if (!this.#browser) {
      throw new Error('Browser is not initialized');
    }

    return this.#browser.afterTest();
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
