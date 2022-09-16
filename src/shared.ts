import { Parameters } from '@storybook/api';
import { mapValues, mergeWith, cloneDeepWith } from 'lodash';
import { SetStoriesData, StoriesRaw, CreeveyStoryParams, StoryInput } from './types';

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
    parameters: combineParameters(
      globalParameters,
      kindParameters[storyData.kind] ?? {},
      storyData.parameters as Parameters,
    ),
  })) as StoriesRaw;
};

interface SerializedRegExp {
  __regexp: true;
  source: string;
  flags: string;
}

export const isSerializedRegExp = (exp: unknown): exp is SerializedRegExp => {
  return typeof exp === 'object' && exp !== null && Reflect.get(exp, '__regexp') === true;
};

export const serializeRegExp = (exp: RegExp): SerializedRegExp => {
  const { source, flags } = exp;
  return {
    __regexp: true,
    source,
    flags,
  };
};

export const deserializeRegExp = ({ source, flags }: SerializedRegExp): RegExp => {
  return new RegExp(source, flags);
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
              if (value instanceof RegExp) {
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
