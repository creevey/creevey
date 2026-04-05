import type { Args } from 'storybook/internal/types';
import { StoryInput, BaseCreeveyTestContext, CreeveyTestContext, StoriesRaw, CreeveyWebdriver, ServerTest } from '../types.js';
export declare const storybookRootID = "storybook-root";
export declare const LOCALHOST_REGEXP: RegExp;
export declare function resolveStorybookUrl(storybookUrl: string, checkUrl: (url: string) => Promise<boolean>): Promise<string>;
export declare function appendIframePath(url: string): string;
export declare function getAddresses(): string[];
export declare abstract class CreeveyWebdriverBase implements CreeveyWebdriver {
    protected abstract takeScreenshot(captureElement: string | null, ignoreElements?: string | string[] | null, options?: any): Promise<Buffer>;
    protected abstract selectStory(id: string): Promise<void>;
    protected abstract updateStoryArgs(story: StoryInput, updatedArgs: Args): Promise<void>;
    abstract getSessionId(): Promise<string>;
    abstract openBrowser(fresh?: boolean): Promise<CreeveyWebdriver | null>;
    abstract closeBrowser(): Promise<void>;
    abstract loadStoriesFromBrowser(): Promise<StoriesRaw>;
    abstract afterTest(test: ServerTest): Promise<void>;
    switchStory(story: StoryInput, context: BaseCreeveyTestContext): Promise<CreeveyTestContext>;
}
