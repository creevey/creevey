import mapValues from 'lodash/mapValues.js';
import mergeWith from 'lodash/mergeWith.js';
import cloneDeepWith from 'lodash/cloneDeepWith.js';
import type { Parameters } from 'storybook/internal/types';
import { SetStoriesData, StoriesRaw, CreeveyStoryParams, StoryInput } from '../types.js';
import { deserializeRegExp, isSerializedRegExp, isRegExp, serializeRegExp } from './serializeRegExp.js';

// NOTE: Copy-paste from storybook/api
export const combineParameters = (...parameterSets: Parameters[]): Parameters =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  mergeWith({}, ...parameterSets, (_: unknown, srcValue: unknown) => {
    // Treat arrays as scalars:
    if (Array.isArray(srcValue)) return srcValue as unknown[];

    return undefined;
  });

// NOTE: Copy-paste from storybook/api
export const denormalizeStoryParameters = ({
  globalParameters,
  kindParameters,
  stories,
}: SetStoriesData): StoriesRaw => {
  return mapValues(stories, (storyData) => ({
    ...storyData,
    parameters: combineParameters(globalParameters, kindParameters[storyData.title] ?? {}, storyData.parameters),
  })) as StoriesRaw;
};

export const serializeRawStories = (stories: StoriesRaw): StoriesRaw => {
  return mapValues(stories, (storyData) => {
    const creevey = storyData.parameters.creevey as CreeveyStoryParams | undefined;
    if (creevey?.skip) {
      return {
        ...storyData,
        parameters: {
          ...storyData.parameters,
          creevey: {
            ...creevey,
            skip: cloneDeepWith(creevey.skip, (value) => {
              if (isRegExp(value)) {
                return serializeRegExp(value);
              }
              return undefined;
            }) as CreeveyStoryParams['skip'],
          },
        },
      };
    }
    return storyData;
  });
};

export const deserializeRawStories = (stories: StoriesRaw): StoriesRaw => {
  return mapValues(stories, deserializeStory);
};

export const deserializeStory = (story: StoryInput): StoryInput => {
  const creevey = story.parameters.creevey as CreeveyStoryParams | undefined;
  if (creevey?.skip) {
    return {
      ...story,
      parameters: {
        ...story.parameters,
        creevey: {
          ...creevey,
          skip: cloneDeepWith(creevey.skip, (value) => {
            if (isSerializedRegExp(value)) {
              return deserializeRegExp(value);
            }
            return undefined;
          }) as CreeveyStoryParams['skip'],
        },
      },
    };
  }
  return story;
};
