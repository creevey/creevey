import { watch } from 'chokidar';
import { existsSync } from 'fs';
import { loadStories as browserProvider } from './browser.js';
import type { Config, CreeveyStoryParams, CreeveyStory, StoriesProvider, StoriesRaw, StoryInput } from '../../types.js';
import { logger } from '../logger.js';
import parse, { CreeveyParamsByStoryId } from '../testsFiles/parser.js';
import { readDirRecursive } from '../utils.js';
import { combineParameters } from '../../shared/index.js';

export const loadStories: StoriesProvider = async (config, storiesListener, webdriver) => {
  let creeveyParamsByStoryId: Partial<CreeveyParamsByStoryId> = {};
  let allStories: StoriesRaw = {};

  const mergeParamsFromTestsToStory = (story: CreeveyStory, creeveyParams: CreeveyStoryParams): void => {
    if (story.parameters) {
      story.parameters.creevey = combineParameters(story.parameters.creevey ?? {}, creeveyParams);
    }
  };

  const stories = await browserProvider(
    config,
    (updatedStoriesByFiles) => {
      // Update our cache of all stories
      Array.from(updatedStoriesByFiles.entries()).forEach(([, storiesArray]) => {
        storiesArray.forEach((story) => {
          allStories[story.id] = story;
          const creeveyParams = creeveyParamsByStoryId[story.id];
          if (creeveyParams) mergeParamsFromTestsToStory(story, creeveyParams);
        });
      });
      storiesListener(updatedStoriesByFiles);
    },
    webdriver,
  );

  // Initialize allStories cache
  allStories = { ...stories };

  // Enable test files hot reloading
  creeveyParamsByStoryId = await parseParams(config, (updatedParams) => {
    logger().debug('Test files changed, re-merging parameters with stories');
    creeveyParamsByStoryId = updatedParams;

    // Re-merge params with all stories and group by file
    const storiesByFile = new Map<string, StoryInput[]>();

    Object.values(allStories).forEach((story) => {
      // Reset creevey params to base (from story itself)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const baseCreeveyParams = story.parameters.creevey ?? {};
      const testFileParams = creeveyParamsByStoryId[story.id];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      story.parameters.creevey = testFileParams
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          combineParameters(baseCreeveyParams, testFileParams)
        : baseCreeveyParams;

      // Group by file for listener
      const fileName: string =
        (typeof story.parameters.fileName === 'string' ? story.parameters.fileName : null) ?? 'unknown';
      if (!storiesByFile.has(fileName)) {
        storiesByFile.set(fileName, []);
      }
      const fileStories = storiesByFile.get(fileName);
      if (fileStories) {
        fileStories.push(story);
      }
    });

    // Notify listener about all updated stories
    storiesListener(storiesByFile);
  });

  Object.entries(stories).forEach(([storyId, story]) => {
    const creeveyParams = creeveyParamsByStoryId[storyId];
    if (creeveyParams) mergeParamsFromTestsToStory(story, creeveyParams);
  });

  return stories;
};

async function parseParams(
  config: Config,
  listener?: (data: CreeveyParamsByStoryId) => void,
): Promise<CreeveyParamsByStoryId> {
  if (!config.testsDir || !existsSync(config.testsDir)) {
    return Promise.resolve({});
  }

  const testFiles = readDirRecursive(config.testsDir).filter((file) => config.testsRegex?.test(file));

  if (listener) {
    watch(testFiles).on('change', (filePath) => {
      logger().debug(`Test file changed: ${filePath}`);

      // Clear module cache and re-parse to get updated test definitions
      void parse(testFiles, true).then((data) => {
        listener(data);
      });
    });
  }

  return parse(testFiles);
}

loadStories.providerName = 'hybrid';
