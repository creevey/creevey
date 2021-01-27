import { BrowserConfig, StoriesProviderFactory, StoriesRaw, StoryInput } from '../../types';
import { getBrowser } from '../selenium';
import { convertStoriesToTests } from './convertStoriesToTests';

export const createDedicatedStorybookStoriesProvider: StoriesProviderFactory = (context) => ({
  init() {
    return Promise.resolve();
  },
  async loadTestsFromStories(options) {
    const browser = await getBrowser(context.config, context.config.browsers['chrome'] as BrowserConfig);

    if (!browser) {
      return {};
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
    // because of getBrowser implementation browser is on the iframe page already
    const stories: any = await browser.executeScript(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return window.__CREEVEY_GET_STORIES__();
    });

    await browser.close();

    cutOffLostBecauseOfBrowserToNodeConversionTests(stories);
    const tests = convertStoriesToTests(options.browsers, stories);

    return tests;
  },
});

function cutOffLostBecauseOfBrowserToNodeConversionTests(stories: StoriesRaw | StoryInput[]): StoryInput[] {
  return (Array.isArray(stories) ? stories : Object.values(stories)).map((storyMeta) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof storyMeta?.parameters?.creevey?.tests === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete storyMeta.parameters.creevey.tests;
    }
    return storyMeta;
  });
}
