import { Browser, BrowserContext, Page, PageScreenshotOptions } from 'playwright-core';
import type { Args } from 'storybook/internal/types';
import { Config, StoriesRaw, StoryInput, StorybookGlobals } from '../../types';
export declare class InternalBrowser {
    #private;
    constructor(browser: Browser, context: BrowserContext, page: Page, traceDir: string, debug?: boolean, storybookGlobals?: StorybookGlobals);
    get browser(): Page;
    get sessionId(): string;
    recordPageError(error: Error): void;
    closeBrowser(): Promise<void>;
    takeScreenshot(captureElement?: string | null, ignoreElements?: string | string[] | null, options?: PageScreenshotOptions): Promise<Buffer>;
    selectStory(id: string): Promise<void>;
    updateStoryArgs(story: StoryInput, updatedArgs: Args): Promise<void>;
    loadStoriesFromBrowser(): Promise<StoriesRaw>;
    static getBrowser(browserName: string, gridUrl: string, config: Config, debug: boolean): Promise<InternalBrowser | null>;
    private init;
    private initStorybook;
    private openStorybookPage;
    private checkUrl;
    private waitForStorybook;
    private collectStorybookDiagnostics;
    private loadStorybookStories;
    private resetMousePosition;
    private defineGlobals;
}
