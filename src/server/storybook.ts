import { StoryApi } from '@storybook/addons';
import core from '@storybook/core';
import { isStorybookVersionLessThan } from './utils';

const framework = 'creevey';

const api = core.start(() => void 0);

//@ts-expect-error: 6.x has { channel }, but 5.x has { context: { channel } }
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
export const channel = api.channel ?? api.context?.channel;
export const clientApi = api.clientApi;
export const forceReRender = api.forceReRender;
export const storiesOf = (kind: string, m: NodeModule): StoryApi => {
  return clientApi.storiesOf(kind, m).addParameters({
    framework,
  });
};
export const configure = (...args: unknown[]): unknown => {
  if (isStorybookVersionLessThan(6)) {
    //@ts-expect-error: 5.x pass `framework` as last argument
    return api.configure(...args, framework);
  }
  //@ts-expect-error: 6.x pass `framework` as first argument
  return api.configure(framework, ...args);
};
export const addDecorator = clientApi.addDecorator;
export const addParameters = clientApi.addParameters;
export const clearDecorators = clientApi.clearDecorators;
export const setAddon = clientApi.setAddon;
export const getStorybook = clientApi.getStorybook;
export const raw = clientApi.raw;
