import type { Renderer } from 'storybook/internal/types';
import type { PreviewWeb, StoryStore } from 'storybook/preview-api';
import { Channel } from 'storybook/internal/channels';
import type { StoriesRaw, StorybookGlobals } from '../types.js';
declare global {
    interface Window {
        __CREEVEY_ANIMATION_DISABLED__: boolean;
        __CREEVEY_SESSION_ID__: string;
        __CREEVYE_STORYBOOK_READY__: boolean;
        __CREEVEY_STORYBOOK_STORIES__: undefined | StoriesRaw;
        __CREEVEY_STORYBOOK_GLOBALS__: undefined | StorybookGlobals;
        __CREEVEY_SELECT_STORY_RESULT__?: null | {
            status: 'success';
        } | {
            status: 'error';
            message: string;
        };
        __STORYBOOK_ADDONS_CHANNEL__: Channel;
        __STORYBOOK_MODULE_CORE_EVENTS__: Record<string, string>;
        __STORYBOOK_STORY_STORE__: StoryStore<Renderer>;
        __STORYBOOK_PREVIEW__: PreviewWeb<Renderer>;
    }
}
export declare function selectStory(storyId: string, callback?: (error: string | null) => void): void;
export declare function insertIgnoreStyles(ignoreSelectors: string[]): HTMLStyleElement;
export declare function removeIgnoreStyles(ignoreStyles: HTMLStyleElement): void;
export declare function getStories(callback?: (stories: StoriesRaw) => void): Promise<StoriesRaw>;
