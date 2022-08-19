import { CreeveyStoryParams, CreeveyTestFunction } from '../types';

export type CreeveyParamsByStoryId = { [storyId: string]: CreeveyStoryParams };

export default async function parse(files: string[]): Promise<CreeveyParamsByStoryId> {
  result = {};

  await Promise.all(files.map(async (file) => import(file)));

  return result;
}

let result: CreeveyParamsByStoryId = {};

let kindTitle = '';
let storyTitle = '';
let storyParams: CreeveyStoryParams | null = null;

const setStoryParameters = (params: CreeveyStoryParams): void => {
  storyParams = params;
};

const getStoryId = (kindTitle: string, storyTitle: string): string => {
  return (kindTitle.split('/').join('-') + '--' + storyTitle).toLowerCase();
};

export const kind = (title: string, kindFn: () => void): void => {
  kindTitle = title;
  kindFn();
  kindTitle = '';
};

export const story = (
  title: string,
  storyFn: (arg: { setStoryParameters: (params: CreeveyStoryParams) => void }) => void,
): void => {
  storyTitle = title;
  storyParams = null;
  storyFn({ setStoryParameters });
  const storyId = getStoryId(kindTitle, storyTitle);
  result[storyId] = Object.assign({}, storyParams, { tests: result[storyId].tests });
  storyTitle = '';
  storyParams = null;
};

export const test = (title: string, testFn: CreeveyTestFunction): void => {
  const storyId = getStoryId(kindTitle, storyTitle);
  if (!result[storyId]) {
    result[storyId] = {};
  }
  result[storyId].tests = Object.assign({}, result[storyId].tests, { [title]: testFn });
};
