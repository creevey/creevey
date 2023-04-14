import chokidar from 'chokidar';

import { loadStories as browserProvider } from './browser';
import type { Config, StoriesRaw, StoryInput, CreeveyStoryParams, CreeveyStory } from '../../../types';
import { logger } from '../../logger';
import parse, { CreeveyParamsByStoryId } from '../../testsFiles/parser';
import { readDirRecursive } from '../../../server/utils';
import { combineParameters } from '../../../shared';

export async function loadStories(
  _config: Config,
  { port }: { port: number },
  storiesListener: (stories: Map<string, StoryInput[]>) => void,
): Promise<StoriesRaw> {
  let creeveyParamsByStoryId: CreeveyParamsByStoryId = {};

  const mergeParamsFromTestsToStory = (story: CreeveyStory, creeveyParams: CreeveyStoryParams): void => {
    if (story.parameters) {
      story.parameters.creevey = combineParameters(story.parameters.creevey || {}, creeveyParams);
    }
  };

  const stories = await browserProvider(_config, { port }, (updatedStoriesByFiles) => {
    Array.from(updatedStoriesByFiles.entries()).forEach(([, storiesArray]) => {
      storiesArray.forEach((story) => {
        const creeveyParams = creeveyParamsByStoryId[story.id];
        if (creeveyParams) {
          mergeParamsFromTestsToStory(story, creeveyParams);
        }
      });
    });
    storiesListener(updatedStoriesByFiles);
  });

  // TODO fix test files hot reloading
  creeveyParamsByStoryId = await parseParams(_config /*, (data) => console.log(data) */);

  Object.entries(stories).forEach(([storyId, story]) => {
    mergeParamsFromTestsToStory(story, creeveyParamsByStoryId[storyId]);
  });

  return stories;
}

async function parseParams(
  config: Config,
  listener?: (data: CreeveyParamsByStoryId) => void,
): Promise<CreeveyParamsByStoryId> {
  if (!config.testsDir) {
    return Promise.resolve({});
  }

  const testFiles = readDirRecursive(config.testsDir).filter((file) => config.testsRegex?.test(file));

  await (await import('../../testsFiles/register')).default(config);

  if (listener) {
    chokidar.watch(testFiles).on('change', (filePath) => {
      logger.debug(`changed: ${filePath}`);

      // doesn't work, always returns {} due modules caching
      // see https://github.com/nodejs/modules/issues/307
      void parse(testFiles).then((data) => listener(data));
    });
  }

  return parse(testFiles);
}
