import type { Args } from 'storybook/internal/types';
import { Config, StoryInput, StoriesRaw } from '../../types.js';
import { CreeveyWebdriverBase } from '../webdriver.js';
export declare class SeleniumWebdriver extends CreeveyWebdriverBase {
    #private;
    constructor(browser: string, gridUrl: string, config: Config, debug: boolean);
    get browser(): import("selenium-webdriver").WebDriver | undefined;
    getSessionId(): Promise<string>;
    openBrowser(fresh?: boolean): Promise<SeleniumWebdriver | null>;
    closeBrowser(): Promise<void>;
    loadStoriesFromBrowser(): Promise<StoriesRaw>;
    afterTest(): Promise<void>;
    protected takeScreenshot(captureElement: string | null, ignoreElements?: string | string[] | null): Promise<Buffer>;
    protected selectStory(id: string): Promise<void>;
    protected updateStoryArgs(story: StoryInput, updatedArgs: Args): Promise<void>;
}
