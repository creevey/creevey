import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';
import Events from '@storybook/core-events';
import { addons, MakeDecoratorResult, makeDecorator } from '@storybook/addons';

// NOTE If you don't use babel-polyfill or any other polyfills that add EventSource for IE11
// You don't get hot reload in IE11. So put polyfill for that to better UX
window.EventSource = NativeEventSource || EventSourcePolyfill;

declare global {
  interface Window {
    __CREEVEY_SELECT_STORY__: (storyId: string, kind: string, name: string, callback: (error?: string) => void) => void;
  }
}

export function withCreevey(): MakeDecoratorResult {
  const channel = addons.getChannel();
  let currentStory = '';

  async function selectStory(
    storyId: string,
    kind: string,
    name: string,
    callback: (error?: string) => void,
  ): Promise<void> {
    if (storyId == currentStory) {
      const storyMissingPromise = new Promise<void>((resolve) => channel.once(Events.STORY_MISSING, resolve));
      channel.emit(Events.SET_CURRENT_STORY, { storyId: true, name, kind });
      await storyMissingPromise;
    }
    currentStory = storyId;
    const storyRenderedPromise = new Promise<void>((resolve, reject) => {
      function removeHandlers(): void {
        /* eslint-disable @typescript-eslint/no-use-before-define */
        channel.off(Events.STORY_RENDERED, renderHandler);
        channel.off(Events.STORY_ERRORED, errorHandler);
        channel.off(Events.STORY_THREW_EXCEPTION, errorHandler);
        /* eslint-enable @typescript-eslint/no-use-before-define */
      }
      function renderHandler(): void {
        removeHandlers();
        resolve();
      }
      function errorHandler({ title, description }: { title: string; description: string }): void {
        removeHandlers();
        reject({
          message: title,
          stack: description,
        });
      }
      function exceptionHandler(exception: Error): void {
        removeHandlers();
        reject(exception);
      }
      channel.once(Events.STORY_RENDERED, renderHandler);
      channel.once(Events.STORY_ERRORED, errorHandler);
      channel.once(Events.STORY_THREW_EXCEPTION, exceptionHandler);
    });
    channel.emit(Events.SET_CURRENT_STORY, { storyId, name, kind });
    try {
      await storyRenderedPromise;
      callback();
    } catch (reason) {
      // NOTE Event `STORY_THREW_EXCEPTION` triggered only in react and vue frameworks and return Error instance
      // NOTE Event `STORY_ERRORED` return error-like object without `name` field
      const errorMessage =
        reason instanceof Error ? reason.stack || reason.message : `${reason.message}\n    ${reason.stack}`;
      callback(errorMessage);
    }
  }

  window.__CREEVEY_SELECT_STORY__ = selectStory;

  return makeDecorator({
    name: 'withCreevey',
    parameterName: 'creevey',
    wrapper: (getStory, context) => getStory(context),
  });
}
