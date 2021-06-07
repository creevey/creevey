import type { StoryApi } from '@storybook/addons';
import { getStorybookFramework, isStorybookVersionLessThan, resolveFromStorybook } from './helpers';

const framework = getStorybookFramework();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const core = require(resolveFromStorybook('@storybook/core')) as typeof import('@storybook/core');

//@ts-expect-error: 6.2 use named exports
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const start = isStorybookVersionLessThan(6, 2) ? (core.default.start as typeof core.start) : core.start;
const api = start(() => void 0);

//@ts-expect-error: 6.x has { channel }, but 5.x has { context: { channel } }
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
export const channel = api.channel ?? api.context?.channel;
export const clientApi = api.clientApi;
export const forceReRender = api.forceReRender;
export const storiesOf = (kind: string, m: NodeModule): StoryApi => {
  return clientApi.storiesOf(kind, m).addParameters({
    framework,
  });
};
export const configure = (...args: unknown[]): unknown => {
  if (isStorybookVersionLessThan(5, 2)) {
    //NOTE: Storybook <= 5.1 pass args as is
    //@ts-expect-error: ignore it
    return api.configApi.configure(...args);
  }
  if (isStorybookVersionLessThan(6)) {
    //NOTE: Storybook <= 5.3 pass `framework` as last argument
    //@ts-expect-error: ignore it
    return api.configure(...args, framework);
  }
  //NOTE Storybook 6.x pass `framework` as first argument
  //@ts-expect-error: ignore it
  return api.configure(framework, ...args);
};
export const addDecorator = clientApi.addDecorator;
export const addParameters = clientApi.addParameters;
export const clearDecorators = clientApi.clearDecorators;
export const setAddon = clientApi.setAddon;
export const getStorybook = clientApi.getStorybook;
export const raw = clientApi.raw;
