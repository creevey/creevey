import type { StoriesRaw, ServerTest, StoryInput } from '../types.js';
export declare function loadTestsFromStories(browsers: string[], provider: (storiesListener: (stories: Map<string, StoryInput[]>) => void) => Promise<StoriesRaw>, update?: (testsDiff: Partial<Record<string, ServerTest>>) => void): Promise<Partial<Record<string, ServerTest>>>;
