import { Parameters } from '@storybook/api';
import { mapValues, mergeWith } from 'lodash';
import { SetStoriesData, StoriesRaw } from './types.js';

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
