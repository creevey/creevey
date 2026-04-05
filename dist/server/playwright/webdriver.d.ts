import type { Args } from 'storybook/internal/types';
import type { Config, StoriesRaw, StoryInput } from '../../types';
import { CreeveyWebdriverBase } from '../webdriver';
import { PageScreenshotOptions } from 'playwright-core';
export declare class PlaywrightWebdriver extends CreeveyWebdriverBase {
    #private;
    constructor(browser: string, gridUrl: string, config: Config, debug: boolean);
    get browser(): import("playwright-core").Page | undefined;
    getSessionId(): Promise<string>;
    openBrowser(fresh?: boolean): Promise<PlaywrightWebdriver | null>;
    closeBrowser(): Promise<void>;
    loadStoriesFromBrowser(): Promise<StoriesRaw>;
    afterTest(): Promise<void>;
    protected takeScreenshot(captureElement: string | null, ignoreElements?: string | string[] | null, options?: PageScreenshotOptions): Promise<Buffer>;
    protected selectStory(id: string): Promise<void>;
    protected updateStoryArgs(story: StoryInput, updatedArgs: Args): Promise<void>;
}
