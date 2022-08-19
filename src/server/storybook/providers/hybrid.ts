import chokidar from 'chokidar';

import { loadStories as browserProvider } from './browser';
import type { Config, StoriesRaw, StoryInput, CreeveyStoryParams, CreeveyStory } from '../../../types';
import { logger } from '../../logger';
import parse, { CreeveyParamsByStoryId } from '../../parser';
import { readDirRecursive } from '../../../server/utils';

export async function loadStories(
  _config: Config,
  { port }: { port: number },
  storiesListener: (stories: Map<string, StoryInput[]>) => void,
): Promise<StoriesRaw> {
  let creeveyParamsByStoryId: CreeveyParamsByStoryId = {};

  const stories = await browserProvider(_config, { port }, (updatedStoriesByFiles) => {
    Array.from(updatedStoriesByFiles.entries()).forEach(([, storiesArray]) => {
      storiesArray.forEach((story) => {
        const creeveyParams = creeveyParamsByStoryId[story.id];
        if (creeveyParams) {
          story.parameters = Object.assign({}, story.parameters, {
            creevey: Object.assign({}, (story as CreeveyStory).parameters?.creevey, creeveyParams),
          });
        }
      });
    });
    storiesListener(updatedStoriesByFiles);
  });

  // TODO fix test files hot reloading
  creeveyParamsByStoryId = await parseParams(_config /*, (data) => console.log(data) */);

  Object.entries<CreeveyStoryParams>(creeveyParamsByStoryId).forEach(([storyId, creeveyParams]) => {
    const story: CreeveyStory = stories[storyId];
    if (story) {
      story.parameters = Object.assign({}, story.parameters, {
        creevey: Object.assign({}, story.parameters?.creevey, creeveyParams),
      });
    }
  });

  return stories;
}

function parseParams(
  config: Config,
  listener?: (data: CreeveyParamsByStoryId) => void,
): Promise<CreeveyParamsByStoryId> {
  if (!config.testDir) {
    return Promise.resolve({});
  }

  const testFiles = readDirRecursive(config.testDir).filter((file) => config.testRegex?.test(file));

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
