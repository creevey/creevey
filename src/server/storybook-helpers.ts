import type { Renderer } from 'storybook/internal/types';
import type { PreviewWeb, StoryStore } from 'storybook/preview-api';
import { Channel } from 'storybook/internal/channels';
import type { CreeveyStoryParams, StoriesRaw, StorybookGlobals } from '../types.js';
import type { SerializedRegExp } from '../shared/serializeRegExp.js';

declare global {
  interface Window {
    __CREEVEY_ANIMATION_DISABLED__: boolean;
    __CREEVEY_SELECT_STORY_RESULT__: null | { status: 'success' } | { status: 'error'; message: string };
    __STORYBOOK_ADDONS_CHANNEL__: Channel;
    __STORYBOOK_STORY_STORE__: StoryStore<Renderer>;
    __STORYBOOK_PREVIEW__: PreviewWeb<Renderer>;
  }
}

// TODO Use StorybookEvents.STORY_RENDER_PHASE_CHANGED: `loading/rendering/completed` with storyId
// TODO Check other statuses and statuses with play function
// TODO: New events
// PLAY_FUNCTION_THREW_EXCEPTION: 'playFunctionThrewException',
// STORY_FINISHED: 'storyFinished',
// STORY_MISSING: 'storyMissing',
export function selectStory(
  [storyId, globals]: [string, StorybookGlobals | undefined],
  callback?: (error: string | null) => void,
): void {
  const STORYBOOK_EVENTS = {
    SET_STORIES: 'setStories',
    SET_CURRENT_STORY: 'setCurrentStory',
    FORCE_REMOUNT: 'forceRemount',
    STORY_RENDERED: 'storyRendered',
    STORY_ERRORED: 'storyErrored',
    STORY_THREW_EXCEPTION: 'storyThrewException',
    UPDATE_STORY_ARGS: 'updateStoryArgs',
    SET_GLOBALS: 'setGlobals',
    UPDATE_GLOBALS: 'updateGlobals',
    GLOBALS_UPDATED: 'globalsUpdated',
  };

  const addonsChannel = (): Channel => window.__STORYBOOK_ADDONS_CHANNEL__;

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

  function isObject(x: unknown): x is Record<string, unknown> {
    return typeof x == 'object' && x != null;
  }

  function disableAnimation(): void {
    window.__CREEVEY_ANIMATION_DISABLED__ = true;
    const style = document.createElement('style');
    const textNode = document.createTextNode(disableAnimationsStyles);
    style.setAttribute('type', 'text/css');
    style.appendChild(textNode);
    document.head.appendChild(style);
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
      channel.off(STORYBOOK_EVENTS.STORY_ERRORED, errorHandler);
      channel.off(STORYBOOK_EVENTS.STORY_THREW_EXCEPTION, exceptionHandler);
      // channel.off(STORYBOOK_EVENTS.PLAY_FUNCTION_THREW_EXCEPTION, exceptionHandler);
    }

    channel.once(STORYBOOK_EVENTS.STORY_ERRORED, errorHandler);
    channel.once(STORYBOOK_EVENTS.STORY_THREW_EXCEPTION, exceptionHandler);
    // channel.once(STORYBOOK_EVENTS.PLAY_FUNCTION_THREW_EXCEPTION, exceptionHandler);

    return Object.assign(promise, { cancel: removeHandlers });
  }

  function waitForStoryRendered(channel: Channel): Promise<void> & { cancel: () => void } {
    let resolveCallback: () => void;
    const promise = new Promise<void>((resolve) => (resolveCallback = resolve));
    function renderHandler(): void {
      resolveCallback();
    }
    function removeHandlers(): void {
      channel.off(STORYBOOK_EVENTS.STORY_RENDERED, renderHandler);
    }

    channel.once(STORYBOOK_EVENTS.STORY_RENDERED, renderHandler);

    return Object.assign(promise, { cancel: removeHandlers });
  }

  let currentStory = '';

  const currentSelection = window.__STORYBOOK_PREVIEW__.currentSelection;

  if (currentSelection) {
    currentStory = currentSelection.storyId;
  }

  if (!window.__CREEVEY_ANIMATION_DISABLED__) disableAnimation();

  const channel = addonsChannel();

  const renderPromise = waitForStoryRendered(channel);
  const errorPromise = catchRenderError(channel);

  setTimeout(() => {
    if (storyId == currentStory) channel.emit(STORYBOOK_EVENTS.FORCE_REMOUNT, { storyId });
    else channel.emit(STORYBOOK_EVENTS.SET_CURRENT_STORY, { storyId });
    channel.emit(STORYBOOK_EVENTS.UPDATE_GLOBALS, { globals });
  }, 0);

  void (async () => {
    try {
      await Promise.race([
        (async () => {
          await renderPromise;
          await waitForFontsLoaded();
        })(),
        errorPromise,
      ]);
      if (callback) callback(null);
      window.__CREEVEY_SELECT_STORY_RESULT__ = { status: 'success' };
    } catch (reason) {
      // NOTE Event `STORY_THREW_EXCEPTION` triggered only in react and vue frameworks and return Error instance
      // NOTE Event `STORY_ERRORED` return error-like object without `name` field
      const errorMessage =
        reason instanceof Error
          ? // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            reason.stack || reason.message
          : isObject(reason)
            ? `${reason.message as string}\n    ${reason.stack as string}`
            : (reason as string);
      if (callback) callback(errorMessage);
      window.__CREEVEY_SELECT_STORY_RESULT__ = { status: 'error', message: errorMessage };
    } finally {
      renderPromise.cancel();
      errorPromise.cancel();
    }
  })();
}

export function insertIgnoreStyles(ignoreSelectors: string[]): HTMLStyleElement {
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

export function removeIgnoreStyles(ignoreStyles: HTMLStyleElement): void {
  ignoreStyles.remove();
}

// TODO Find a way to send stories updates to the server
export async function getStories(callback?: (stories: StoriesRaw) => void): Promise<StoriesRaw> {
  function isRegExp(exp: unknown): exp is RegExp {
    return exp instanceof RegExp;
  }
  function serializeRegExp(exp: RegExp): SerializedRegExp {
    const { source, flags } = exp;
    return {
      __regexp: true,
      source,
      flags,
    };
  }
  function mapValues<T extends Record<string, unknown>, R>(
    obj: T,
    iteratee: (value: T[keyof T], key: keyof T) => R,
  ): { [K in keyof T]: R } {
    const result = {} as { [K in keyof T]: R };
    (Object.keys(obj) as (keyof T)[]).forEach((key) => {
      result[key] = iteratee(obj[key], key);
    });
    return result;
  }

  function cloneDeepWith<T>(value: T, customizer: (value: unknown) => unknown): T {
    const customized = customizer(value);
    if (customized !== undefined) return customized as T;

    if (Array.isArray(value)) {
      return value.map((item) => cloneDeepWith(item as T, customizer)) as T;
    }

    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = cloneDeepWith(v, customizer);
      }
      return out as unknown as T;
    }

    return value;
  }

  function serializeRawStories(stories: StoriesRaw): StoriesRaw {
    return mapValues(stories, (storyData) => {
      const creevey = storyData.parameters.creevey as CreeveyStoryParams | undefined;
      const skip = creevey ? creevey.skip : undefined;
      if (skip) {
        return {
          ...storyData,
          parameters: {
            ...storyData.parameters,
            creevey: {
              ...creevey,
              skip: cloneDeepWith(skip, (value) => {
                if (isRegExp(value)) {
                  return serializeRegExp(value);
                }
                return undefined;
              }) as CreeveyStoryParams['skip'],
            },
          },
        };
      }
      return storyData;
    });
  }
  const stories = await window.__STORYBOOK_PREVIEW__.extract();
  const serializedStories = serializeRawStories(stories);
  if (callback) callback(serializedStories);
  return serializedStories;
}
