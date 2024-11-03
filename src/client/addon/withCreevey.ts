import * as Events from '@storybook/core-events';
import type { PreviewWeb } from '@storybook/preview-web';
import type { Renderer, StoryContextForEnhancers } from '@storybook/csf';
import type { StoryStore } from '@storybook/client-api';
import { makeDecorator } from '@storybook/preview-api';
import { Channel } from '@storybook/channels';
import { CaptureOptions, CreeveyStoryParams, isObject, noop, StoriesRaw, StorybookGlobals } from '../../types.js';
import { serializeRawStories } from '../../shared/index.js';
import { getConnectionUrl } from '../shared/helpers.js';

declare global {
  interface Window {
    __CREEVEY_SERVER_HOST__: string;
    __CREEVEY_SERVER_PORT__: number;
    __CREEVEY_WORKER_ID__: number;
    __CREEVEY_GET_STORIES__: () => Promise<StoriesRaw | undefined>;
    __CREEVEY_SELECT_STORY__: (
      storyId: string,
      shouldWaitForReady: boolean,
      callback: (response: [error?: string | null, isCaptureCalled?: boolean]) => void,
    ) => Promise<void>;
    __CREEVEY_UPDATE_GLOBALS__: (globals: StorybookGlobals) => void;
    __CREEVEY_INSERT_IGNORE_STYLES__: (ignoreElements: string[]) => HTMLStyleElement;
    __CREEVEY_REMOVE_IGNORE_STYLES__: (ignoreStyles: HTMLStyleElement) => void;
    __CREEVEY_HAS_PLAY_COMPLETED_YET__: (callback: (isPlayCompleted: boolean) => void) => void;
    __CREEVEY_SET_READY_FOR_CAPTURE__?: () => void;
    __STORYBOOK_ADDONS_CHANNEL__: Channel;
    __STORYBOOK_STORY_STORE__: StoryStore<Renderer>;
    __STORYBOOK_PREVIEW__: PreviewWeb<Renderer>;
  }
}

interface CreeveyTestsState {
  setStoriesCounter?: number;
  creeveyHost?: string;
  creeveyPort?: number;
  isTestBrowser?: boolean;
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
  // TODO Use document.fonts.ready instead
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

function waitForCaptureCall(): Promise<void> {
  return new Promise((resolve) => (captureResolver = resolve));
}

function initCreeveyState(): void {
  const prevState = JSON.parse(window.localStorage.getItem('Creevey_Tests') ?? '{}') as CreeveyTestsState;

  if (prevState.creeveyHost) window.__CREEVEY_SERVER_HOST__ = prevState.creeveyHost;
  if (prevState.creeveyPort) window.__CREEVEY_SERVER_PORT__ = prevState.creeveyPort;
  if (prevState.setStoriesCounter) setStoriesCounter = prevState.setStoriesCounter;
  if (prevState.isTestBrowser) isTestBrowser = prevState.isTestBrowser;

  window.addEventListener('beforeunload', () => {
    window.localStorage.setItem(
      'Creevey_Tests',
      JSON.stringify({
        creeveyHost: window.__CREEVEY_SERVER_HOST__,
        creeveyPort: window.__CREEVEY_SERVER_PORT__,
        setStoriesCounter,
        isTestBrowser,
      } as CreeveyTestsState),
    );
  });
}

let isTestBrowser = false;
let captureResolver: () => void;
let waitForCreevey: Promise<void>;
let creeveyReady: () => void;
let setStoriesCounter = 0;

export function withCreevey(): ReturnType<typeof makeDecorator> {
  const addonsChannel = (): Channel => window.__STORYBOOK_ADDONS_CHANNEL__;

  let isAnimationDisabled = false;

  initCreeveyState();

  function disableAnimation(): void {
    isAnimationDisabled = true;
    const style = document.createElement('style');
    const textNode = document.createTextNode(disableAnimationsStyles);
    style.setAttribute('type', 'text/css');
    style.appendChild(textNode);
    document.head.appendChild(style);
  }

  async function getStories(): Promise<StoriesRaw | undefined> {
    const stories = serializeRawStories(await window.__STORYBOOK_PREVIEW__.extract());
    const storiesByFiles = new Map<string, StoryContextForEnhancers[]>();
    Object.values(stories).forEach((story) => {
      const fileName = story.parameters.fileName as string;
      const storiesFromFile = storiesByFiles.get(fileName);
      if (storiesFromFile) storiesFromFile.push(story);
      else storiesByFiles.set(fileName, [story]);
    });
    void fetch(`http://${getConnectionUrl()}/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setStoriesCounter, stories: [...storiesByFiles.entries()] }),
    });
    return stories;
  }

  // TODO Use Events.STORY_RENDER_PHASE_CHANGED: `loading/rendering/completed` with storyId
  // TODO Check other statuses and statuses with play function
  async function selectStory(
    storyId: string,
    shouldWaitForReady: boolean,
    callback: (response: [error?: string | null, isCaptureCalled?: boolean]) => void,
  ): Promise<void> {
    const currentStory = window.__STORYBOOK_PREVIEW__.currentSelection?.storyId ?? '';

    if (!isAnimationDisabled) disableAnimation();

    isTestBrowser = true;
    const channel = addonsChannel();
    const waitForReady = shouldWaitForReady
      ? new Promise<void>((resolve) => (window.__CREEVEY_SET_READY_FOR_CAPTURE__ = resolve))
      : Promise.resolve();

    let isCaptureCalled = false;
    const renderPromise = waitForStoryRendered(channel);
    const errorPromise = catchRenderError(channel);
    const capturePromise = waitForCaptureCall().then(() => (isCaptureCalled = true));

    setTimeout(() => {
      if (storyId == currentStory) channel.emit(Events.FORCE_REMOUNT, { storyId });
      else channel.emit(Events.SET_CURRENT_STORY, { storyId });
    }, 0);

    try {
      await Promise.race([
        (async () => {
          await Promise.race([renderPromise, capturePromise]);
          await waitForFontsLoaded();
          await waitForReady;
        })(),
        errorPromise,
      ]);
      callback([null, isCaptureCalled]);
    } catch (reason) {
      // NOTE Event `STORY_THREW_EXCEPTION` triggered only in react and vue frameworks and return Error instance
      // NOTE Event `STORY_ERRORED` return error-like object without `name` field
      const errorMessage =
        reason instanceof Error
          ? (reason.stack ?? reason.message)
          : isObject(reason)
            ? `${reason.message as string}\n    ${reason.stack as string}`
            : (reason as string);
      callback([errorMessage]);
    } finally {
      renderPromise.cancel();
      errorPromise.cancel();
    }
  }

  function updateGlobals(globals: StorybookGlobals): void {
    addonsChannel().emit(Events.UPDATE_GLOBALS, { globals });
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

  function hasPlayCompletedYet(callback: (isPlayCompleted: boolean) => void): void {
    creeveyReady();
    let isCaptureCalled = false;
    let isPlayCompleted = false;

    const channel = addonsChannel();
    void waitForStoryRendered(channel).then(() => {
      if (isCaptureCalled) return;
      isPlayCompleted = true;
      callback(true);
    });
    void waitForCaptureCall().then(() => {
      if (isPlayCompleted) return;
      isCaptureCalled = true;
      callback(false);
    });
  }

  window.__CREEVEY_GET_STORIES__ = getStories;
  window.__CREEVEY_SELECT_STORY__ = selectStory;
  window.__CREEVEY_UPDATE_GLOBALS__ = updateGlobals;
  window.__CREEVEY_INSERT_IGNORE_STYLES__ = insertIgnoreStyles;
  window.__CREEVEY_REMOVE_IGNORE_STYLES__ = removeIgnoreStyles;
  window.__CREEVEY_HAS_PLAY_COMPLETED_YET__ = hasPlayCompletedYet;
  window.__CREEVEY_SET_READY_FOR_CAPTURE__ = noop;

  return makeDecorator({
    name: 'withCreevey',
    parameterName: 'creevey',

    wrapper: (getStory, context) => {
      // TODO Define proper types, like captureElement is a promise
      const { captureElement } = (context.parameters.creevey = (context.parameters.creevey ??
        {}) as CreeveyStoryParams);
      Object.defineProperty(context.parameters.creevey, 'captureElement', {
        get() {
          switch (true) {
            case captureElement === undefined:
              return Promise.resolve(context.canvasElement);
            case captureElement === null:
              return Promise.resolve(document.documentElement);
            case typeof captureElement == 'string':
              return Promise.resolve((context.canvasElement as Element).querySelector(captureElement));
            case typeof captureElement == 'function':
              // TODO Define type for it
              return Promise.resolve(
                (captureElement as unknown as (ctx: typeof context) => Promise<HTMLElement> | HTMLElement)(context),
              );
          }
        },
        enumerable: true,
        configurable: true,
      });

      return getStory(context);
    },
  });
}

export async function capture(options?: CaptureOptions): Promise<void> {
  if (!isTestBrowser) return;

  captureResolver();
  waitForCreevey = new Promise((resolve) => (creeveyReady = resolve));

  void fetch(`http://${getConnectionUrl()}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workerId: window.__CREEVEY_WORKER_ID__, options }),
  });

  await waitForCreevey;
}
