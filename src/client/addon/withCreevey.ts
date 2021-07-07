import Events from '@storybook/core-events';
import { addons, MakeDecoratorResult, makeDecorator, Channel } from '@storybook/addons';
import { isObject, noop, StorybookGlobals } from '../../types';

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
    __CREEVEY_SELECT_STORY__: (
      storyId: string,
      kind: string,
      name: string,
      shouldWaitForReady: boolean,
      callback: (error?: string) => void,
    ) => void;
    __CREEVEY_UPDATE_GLOBALS__: (globals: StorybookGlobals) => void;
    __CREEVEY_INSERT_IGNORE_STYLES__: (ignoreElements: string[]) => HTMLStyleElement;
    __CREEVEY_REMOVE_IGNORE_STYLES__: (ignoreStyles: HTMLStyleElement) => void;
    __CREEVEY_SET_READY_FOR_CAPTURE__?: () => void;
    __STORYBOOK_ADDONS_CHANNEL__: Channel;
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

const disableAnimationsStyles = `
*,
*:hover,
*::before,
*::after {
  animation-delay: -0.0001ms !important;
  animation-duration: 0s !important;
  animation-play-state: paused !important;
  cursor: none !important;
  caret-color: transparent !important;
  transition: 0s !important;
}
`;

async function resetCurrentStory(channel: Channel): Promise<void> {
  setTimeout(() => channel.emit(Events.SET_CURRENT_STORY, { storyId: true, name: '', kind: '' }), 0);
  return new Promise<void>((resolve) => channel.once(Events.STORY_MISSING, resolve));
}

function catchRenderError(channel: Channel): Promise<void> & { cancel: () => void } {
  let rejectCallback: (reason?: unknown) => void;
  const promise = new Promise<void>((_resolve, reject) => (rejectCallback = reject));

  function errorHandler({ title, description }: { title: string; description: string }): void {
    rejectCallback({
      message: title,
      stack: description,
    });
  }
  function exceptionHandler(exception: Error): void {
    rejectCallback(exception);
  }
  function removeHandlers(): void {
    channel.off(Events.STORY_ERRORED, errorHandler);
    channel.off(Events.STORY_THREW_EXCEPTION, errorHandler);
  }

  channel.once(Events.STORY_ERRORED, errorHandler);
  channel.once(Events.STORY_THREW_EXCEPTION, exceptionHandler);

  return Object.assign(promise, { cancel: removeHandlers });
}

function waitForStoryRendered(channel: Channel): Promise<void> & { cancel: () => void } {
  let resolveCallback: () => void;
  const promise = new Promise<void>((resolve) => (resolveCallback = resolve));
  function renderHandler(): void {
    resolveCallback();
  }
  function removeHandlers(): void {
    channel.off(Events.STORY_RENDERED, renderHandler);
  }

  channel.once(Events.STORY_RENDERED, renderHandler);

  return Object.assign(promise, { cancel: removeHandlers });
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
  let isAnimationDisabled = false;

  function disableAnimation(): void {
    isAnimationDisabled = true;
    const style = document.createElement('style');
    const textNode = document.createTextNode(disableAnimationsStyles);
    style.setAttribute('type', 'text/css');
    style.appendChild(textNode);
    document.head.appendChild(style);
  }

  async function selectStory(
    storyId: string,
    kind: string,
    name: string,
    shouldWaitForReady: boolean,
    callback: (error?: string) => void,
  ): Promise<void> {
    if (!isAnimationDisabled) disableAnimation();

    const channel = addons.getChannel();
    const waitForReady = shouldWaitForReady
      ? new Promise<void>((resolve) => (window.__CREEVEY_SET_READY_FOR_CAPTURE__ = resolve))
      : Promise.resolve();

    if (storyId == currentStory) await resetCurrentStory(channel);
    else currentStory = storyId;

    const renderPromise = waitForStoryRendered(channel);
    const errorPromise = catchRenderError(channel);

    setTimeout(() => channel.emit(Events.SET_CURRENT_STORY, { storyId, name, kind }), 0);

    try {
      await Promise.race([
        (async () => {
          await waitForStoryRendered(channel);
          await waitForFontsLoaded();
          await waitForReady;
        })(),
        errorPromise,
      ]);
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
    } finally {
      renderPromise.cancel();
      errorPromise.cancel();
    }
  }

  function updateGlobals(globals: StorybookGlobals): void {
    addons.getChannel().emit(Events.UPDATE_GLOBALS, { globals });
  }

  function insertIgnoreStyles(ignoreSelectors: string[]): HTMLStyleElement {
    const stylesElement = document.createElement('style');
    stylesElement.setAttribute('type', 'text/css');
    document.head.appendChild(stylesElement);
    ignoreSelectors.forEach((selector) => {
      stylesElement.innerHTML += `
        ${selector} {
          background: #000 !important;
          box-shadow: none !important;
          text-shadow: none !important;
          outline: 0 !important;
          color: rgba(0,0,0,0) !important;
        }
        ${selector} *, ${selector}::before, ${selector}::after {
          visibility: hidden !important;
        }
      `;
    });
    return stylesElement;
  }

  function removeIgnoreStyles(ignoreStyles: HTMLStyleElement): void {
    ignoreStyles.parentNode?.removeChild(ignoreStyles);
  }

  window.__CREEVEY_SELECT_STORY__ = selectStory;
  window.__CREEVEY_UPDATE_GLOBALS__ = updateGlobals;
  window.__CREEVEY_INSERT_IGNORE_STYLES__ = insertIgnoreStyles;
  window.__CREEVEY_REMOVE_IGNORE_STYLES__ = removeIgnoreStyles;
  window.__CREEVEY_SET_READY_FOR_CAPTURE__ = noop;

  return makeDecorator({
    name: 'withCreevey',
    parameterName: 'creevey',
    wrapper: (getStory, context) => getStory(context) as unknown,
  });
}
