import type { Parameters } from 'storybook/internal/types';
import { SetStoriesData, StoriesRaw, StoryInput } from '../types.js';
export declare const combineParameters: (...parameterSets: Parameters[]) => Parameters;
export declare const denormalizeStoryParameters: ({ globalParameters, kindParameters, stories, }: SetStoriesData) => StoriesRaw;
export declare const serializeRawStories: (stories: StoriesRaw) => StoriesRaw;
export declare const deserializeRawStories: (stories: StoriesRaw) => StoriesRaw;
export declare const deserializeStory: (story: StoryInput) => StoryInput;
