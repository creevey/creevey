import { Parameters } from '@storybook/api';
import { SetStoriesPayload } from '@storybook/api/dist/lib/stories';
import { mapValues, mergeWith } from 'lodash';
import { StoriesRaw, TestStatus } from '../../types';

export function getEmojiByTestStatus(status: TestStatus | undefined, skip: string | boolean = false): string {
  switch (status) {
    case 'failed': {
      return '❌';
    }
    case 'success': {
      return '✔';
    }
    case 'running': {
      return '🟡';
    }
    case 'pending': {
      return '🕗';
    }
    default: {
      if (skip) return '⏸';
      return '';
    }
  }
}

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
}: SetStoriesPayload): StoriesRaw => {
  return mapValues(stories, (storyData) => ({
    ...storyData,
    parameters: combineParameters(globalParameters, kindParameters[storyData.kind], storyData.parameters as Parameters),
  })) as StoriesRaw;
};
