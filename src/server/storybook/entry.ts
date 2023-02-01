import type { StoryApi } from '@storybook/addons';
import { addons } from '@storybook/addons';
import { getStorybookFramework, resolveFromStorybook } from './helpers';

const framework = getStorybookFramework();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const core = require(resolveFromStorybook('@storybook/core-client')) as typeof import('@storybook/core-client');

const start = core.start;
const api = start(() => void 0);

export const channel = addons.getChannel();

type ClientApi = ReturnType<typeof start>['clientApi'];

export const clientApi: ClientApi = api.clientApi;
export const forceReRender = api.forceReRender;
export const storiesOf = (kind: string, m: NodeModule): StoryApi => {
  return clientApi.storiesOf(kind, m).addParameters({
    framework,
  });
};
export const configure = (...args: unknown[]): unknown => {
  //NOTE Storybook 6.x pass `framework` as first argument
  //@ts-expect-error: ignore it
  return api.configure(framework, ...args);
};
export const addDecorator: ClientApi['addDecorator'] = clientApi.addDecorator;
export const addParameters: ClientApi['addParameters'] = clientApi.addParameters;
export const clearDecorators: ClientApi['clearDecorators'] = clientApi.clearDecorators;
export const setAddon = clientApi.setAddon;
export const getStorybook: ClientApi['getStorybook'] = clientApi.getStorybook;
export const raw: ClientApi['raw'] = clientApi.raw;
