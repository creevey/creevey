import type { StoryApi } from '@storybook/addons';
import type { Channel } from '@storybook/channels';
import { addons } from '@storybook/addons';
import { getStorybookFramework, isStorybookVersionLessThan, resolveFromStorybook } from './helpers.js';

const framework = getStorybookFramework();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const core = require(resolveFromStorybook('@storybook/core')) as typeof import('@storybook/core');

//@ts-expect-error: 6.2 use named exports
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const start = isStorybookVersionLessThan(6, 2) ? (core.default.start as typeof core.start) : core.start;
const api = start(() => void 0);

export const channel = isStorybookVersionLessThan(6, 4)
  ? //@ts-expect-error: 6.x has { channel }, but 5.x has { context: { channel } }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ((api.channel ?? api.context?.channel) as Channel)
  : addons.getChannel();

type ClientApi = ReturnType<typeof start>['clientApi'];

export const clientApi: ClientApi = api.clientApi;
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
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
export const addDecorator: ClientApi['addDecorator'] = clientApi.addDecorator;
export const addParameters: ClientApi['addParameters'] = clientApi.addParameters;
export const clearDecorators: ClientApi['clearDecorators'] = clientApi.clearDecorators;
export const setAddon = clientApi.setAddon;
export const getStorybook: ClientApi['getStorybook'] = clientApi.getStorybook;
export const raw: ClientApi['raw'] = clientApi.raw;
