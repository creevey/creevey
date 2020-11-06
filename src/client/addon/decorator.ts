import Events from '@storybook/core-events';
import { addons, MakeDecoratorResult, makeDecorator } from '@storybook/addons';
import { isObject } from '../../types';

if (typeof process != 'object' || typeof process.version != 'string') {
  // NOTE If you don't use babel-polyfill or any other polyfills that add EventSource for IE11
  // You don't get hot reload in IE11. So put polyfill for that to better UX
  // Don't load in nodejs environment
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  const { NativeEventSource, EventSourcePolyfill } = require('event-source-polyfill');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  window.EventSource = NativeEventSource || EventSourcePolyfill;
}

declare global {
  interface Window {
    __CREEVEY_SELECT_STORY__: (storyId: string, kind: string, name: string, callback: (error?: string) => void) => void;
  }

  interface Document {
    fonts: FontFaceSet;
  }

  type CSSOMString = string;
  type FontFaceLoadStatus = 'unloaded' | 'loading' | 'loaded' | 'error';
  type FontFaceSetStatus = 'loading' | 'loaded';

  class FontFace extends FontFaceDescriptors {
    constructor(family: string, source: string | ArrayBuffer, descriptors?: FontFaceDescriptors);
    readonly status: FontFaceLoadStatus;
    readonly loaded: Promise<FontFace>;
    variationSettings: CSSOMString;
    display: CSSOMString;
    load(): Promise<FontFace>;
  }

  class FontFaceDescriptors {
    family: CSSOMString;
    style: CSSOMString;
    weight: CSSOMString;
    stretch: CSSOMString;
    unicodeRange: CSSOMString;
    variant: CSSOMString;
    featureSettings: CSSOMString;
  }

  interface FontFaceSet extends Iterable<FontFace>, EventTarget {
    readonly status: FontFaceSetStatus;
    readonly ready: Promise<FontFaceSet>;
    readonly size: number;
    add(font: FontFace): void;
    check(font: string, text?: string): boolean; // throws exception
    load(font: string, text?: string): Promise<FontFace[]>;
    delete(font: FontFace): void;
    clear(): void;
  }
}

function waitForFontsLoaded(): Promise<void> | void {
  if (!document.fonts) return;

  const areFontsLoading = Array.from(document.fonts).some((font) => font.status == 'loading');

  if (areFontsLoading) {
    return new Promise((resolve) => {
      const fontsLoadedHandler = (): void => {
        document.fonts.removeEventListener('loadingdone', fontsLoadedHandler);
        resolve();
      };
      document.fonts.addEventListener('loadingdone', fontsLoadedHandler);
    });
  }
}

export function withCreevey(): MakeDecoratorResult {
  let currentStory = '';

  async function selectStory(
    storyId: string,
    kind: string,
    name: string,
    callback: (error?: string) => void,
  ): Promise<void> {
    const channel = addons.getChannel();
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
      await waitForFontsLoaded();
      callback();
    } catch (reason) {
      // NOTE Event `STORY_THREW_EXCEPTION` triggered only in react and vue frameworks and return Error instance
      // NOTE Event `STORY_ERRORED` return error-like object without `name` field
      const errorMessage =
        reason instanceof Error
          ? reason.stack ?? reason.message
          : isObject(reason)
          ? `${reason.message as string}\n    ${reason.stack as string}`
          : (reason as string);
      callback(errorMessage);
    }
  }

  window.__CREEVEY_SELECT_STORY__ = selectStory;

  return makeDecorator({
    name: 'withCreevey',
    parameterName: 'creevey',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    wrapper: (getStory, context) => getStory(context),
  });
}

export const decorators = [withCreevey()];
