import cluster from 'cluster';
import type { CreeveyStory, StoriesProvider, StoriesRaw } from '../../../types';
import { loadStoriesFromBrowser } from '../../selenium';
import { emitStoriesMessage, sendStoriesMessage, subscribeOn, subscribeOnWorker } from '../../messages';
import { isDefined } from '../../../types';
import { logger } from '../../logger';
import { deserializeRawStories } from '../../../shared';

export const loadStories: StoriesProvider = async (_config, _options, storiesListener) => {
  if (cluster.isPrimary) {
    return new Promise<StoriesRaw>((resolve) => {
      const worker = Object.values(cluster.workers ?? {})
        .filter(isDefined)
        .find((worker) => worker.isConnected());

      if (worker) {
        const unsubscribe = subscribeOnWorker(worker, 'stories', (message) => {
          if (message.type == 'set') {
            const { stories, oldTests } = message.payload;
            if (oldTests.length > 0)
              logger.warn(
                `If you use browser stories provider of CSFv3 Storybook feature\n` +
                  `Creevey will not load tests defined in story parameters from following stories:\n` +
                  oldTests.join('\n'),
              );
            unsubscribe();
            resolve(stories);
          }
        });
        sendStoriesMessage(worker, { type: 'get' });
      }
      subscribeOn('stories', (message) => {
        // TODO updates only one browser :(
        if (message.type == 'update') storiesListener(new Map(message.payload));
      });
    });
  } else {
    subscribeOn('stories', (message) => {
      if (message.type == 'get')
        emitStoriesMessage({ type: 'set', payload: { stories, oldTests: storiesWithOldTests } });
      if (message.type == 'update') storiesListener(new Map(message.payload));
    });
    const stories = deserializeRawStories(await loadStoriesFromBrowser());

    const storiesWithOldTests: string[] = [];

    Object.values(stories).forEach((story) => {
      if ((story as CreeveyStory).parameters?.creevey?.tests) {
        delete (story as CreeveyStory).parameters?.creevey?.tests;
        storiesWithOldTests.push(`${story.kind}/${story.name}`);
      }
    });

    return stories;
  }
};

loadStories.providerName = 'browser';
