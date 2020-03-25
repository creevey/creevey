import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';
import Events from '@storybook/core-events';
import { addons, MakeDecoratorResult, makeDecorator } from '@storybook/addons';

// NOTE If you don't use babel-polyfill or any other polyfills that add EventSource for IE11
// You don't get hot reload in IE11. So put polyfill for that to better UX
window.EventSource = NativeEventSource || EventSourcePolyfill;

declare global {
  interface Window {
    __CREEVEY_SELECT_STORY__: (storyId: string, kind: string, name: string, callback: Function) => void;
  }
}

export function withCreevey(): MakeDecoratorResult {
  const channel = addons.getChannel();
  let currentStory = '';

  async function selectStory(storyId: string, kind: string, name: string, callback: Function): Promise<void> {
    if (storyId == currentStory) {
      const storyMissingPromise = new Promise(resolve => channel.once(Events.STORY_MISSING, resolve));
      channel.emit(Events.SET_CURRENT_STORY, { storyId: true, name, kind });
      await storyMissingPromise;
    }
    currentStory = storyId;
    const storyRenderedPromise = new Promise((resolve, reject) => {
      channel.once(Events.STORY_RENDERED, () => {
        channel.off(Events.STORY_ERRORED, reject);
        resolve();
      });
      channel.once(Events.STORY_ERRORED, () => {
        channel.off(Events.STORY_RENDERED, resolve);
        reject();
      });
    });
    channel.emit(Events.SET_CURRENT_STORY, { storyId, name, kind });
    try {
      await storyRenderedPromise;
      callback();
    } catch (error) {
      callback(error);
    }
  }

  window.__CREEVEY_SELECT_STORY__ = selectStory;

  return makeDecorator({
    name: 'withCreevey',
    parameterName: 'creevey',
    wrapper: (getStory, context) => getStory(context),
  });
}
