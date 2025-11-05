import type { Renderer } from 'storybook/internal/types';
import type { PreviewWeb, StoryStore } from 'storybook/preview-api';
import { Channel } from 'storybook/internal/channels';
import type { CreeveyStoryParams, StoriesRaw, StorybookGlobals, StoryInput } from '../types.js';
import type { SerializedRegExp } from '../shared/serializeRegExp.js';

declare global {
  interface Window {
    __CREEVEY_ANIMATION_DISABLED__: boolean;
    __CREEVEY_SESSION_ID__: string;
    __CREEVYE_STORYBOOK_READY__: boolean;
    __CREEVEY_STORYBOOK_STORIES__: undefined | StoriesRaw;
    __CREEVEY_STORYBOOK_GLOBALS__: undefined | StorybookGlobals;
    __CREEVEY_SELECT_STORY_RESULT__: null | { status: 'success' } | { status: 'error'; message: string };
    __STORYBOOK_ADDONS_CHANNEL__: Channel;
    __STORYBOOK_MODULE_CORE_EVENTS__: Record<string, string>;
    __STORYBOOK_STORY_STORE__: StoryStore<Renderer>;
    __STORYBOOK_PREVIEW__: PreviewWeb<Renderer>;
  }
}

// TODO Use StorybookEvents.STORY_RENDER_PHASE_CHANGED: `loading/rendering/completed` with storyId
// TODO Check other statuses and statuses with play function
export function selectStory(storyId: string, callback?: (error: string | null) => void): void {
  const STORYBOOK_EVENTS = {
    SET_STORIES: 'setStories',
    SET_CURRENT_STORY: 'setCurrentStory',
    FORCE_REMOUNT: 'forceRemount',
    STORY_RENDERED: 'storyRendered',
    STORY_FINISHED: 'storyFinished',
    STORY_ERRORED: 'storyErrored',
    // STORY_MISSING: 'storyMissing',
    STORY_THREW_EXCEPTION: 'storyThrewException',
    PLAY_FUNCTION_THREW_EXCEPTION: 'playFunctionThrewException',
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
      channel.off(STORYBOOK_EVENTS.PLAY_FUNCTION_THREW_EXCEPTION, exceptionHandler);
    }

    channel.once(STORYBOOK_EVENTS.STORY_ERRORED, errorHandler);
    channel.once(STORYBOOK_EVENTS.STORY_THREW_EXCEPTION, exceptionHandler);
    if (window.__STORYBOOK_MODULE_CORE_EVENTS__.PLAY_FUNCTION_THREW_EXCEPTION) {
      channel.once(STORYBOOK_EVENTS.PLAY_FUNCTION_THREW_EXCEPTION, exceptionHandler);
    }

    return Object.assign(promise, { cancel: removeHandlers });
  }

  function waitForStoryRendered(channel: Channel): Promise<void> & { cancel: () => void } {
    let resolveCallback: () => void;
    const promise = new Promise<void>((resolve) => (resolveCallback = resolve));
    function renderHandler(): void {
      resolveCallback();
    }
    function removeHandlers(): void {
      channel.off(STORYBOOK_EVENTS.STORY_FINISHED, renderHandler);
      channel.off(STORYBOOK_EVENTS.STORY_RENDERED, renderHandler);
    }

    if (window.__STORYBOOK_MODULE_CORE_EVENTS__.STORY_FINISHED) {
      channel.once(STORYBOOK_EVENTS.STORY_FINISHED, renderHandler);
    } else {
      // NOTE: Earlier versions of Storybook don't have STORY_FINISHED event
      channel.once(STORYBOOK_EVENTS.STORY_RENDERED, renderHandler);
    }

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

  function serializeRawStories(stories: StoriesRaw) {
    for (const storyId in stories) {
      const story = stories[storyId];
      const creevey = story.parameters.creevey as CreeveyStoryParams | undefined;
      if (creevey && 'skip' in creevey && creevey.skip) {
        creevey.skip = cloneDeepWith(creevey.skip, (value) => {
          if (isRegExp(value)) {
            return serializeRegExp(value);
          }
          return undefined;
        }) as CreeveyStoryParams['skip'];
      }
    }
  }

  const stories = await window.__STORYBOOK_PREVIEW__.extract();
  serializeRawStories(stories);
  window.__CREEVEY_STORYBOOK_STORIES__ = stories;
  if (callback) callback(stories);
  return stories;
}

/**
 * Watches for Storybook story changes and sends updates to Creevey server
 * @param serverPort The port where Creevey server is running
 */
export function watchStories(serverPort: number): void {
  const STORYBOOK_EVENTS = {
    SET_STORIES: 'setStories',
  };

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

  function serializeRawStories(stories: StoriesRaw) {
    for (const storyId in stories) {
      const story = stories[storyId];
      const creevey = story.parameters.creevey as CreeveyStoryParams | undefined;
      if (creevey && 'skip' in creevey && creevey.skip) {
        creevey.skip = cloneDeepWith(creevey.skip, (value) => {
          if (isRegExp(value)) {
            return serializeRegExp(value);
          }
          return undefined;
        }) as CreeveyStoryParams['skip'];
      }
    }
  }

  const channel = window.__STORYBOOK_ADDONS_CHANNEL__;

  // Listen for story updates from Storybook HMR
  channel.on(STORYBOOK_EVENTS.SET_STORIES, () => {
    // Extract updated stories
    void (async () => {
      try {
        const stories = await window.__STORYBOOK_PREVIEW__.extract();
        serializeRawStories(stories);
        window.__CREEVEY_STORYBOOK_STORIES__ = stories;

        // Convert stories object to array format expected by the server
        const storiesArray: [string, StoryInput[]][] = [];
        const storiesByFile = new Map<string, StoryInput[]>();

        // Group stories by file
        for (const storyId in stories) {
          const story = stories[storyId];
          const fileName: string =
            (typeof story.parameters.fileName === 'string' ? story.parameters.fileName : null) ?? 'unknown';
          if (!storiesByFile.has(fileName)) {
            storiesByFile.set(fileName, []);
          }
          const fileStories = storiesByFile.get(fileName);
          if (fileStories) {
            fileStories.push(story);
          }
        }

        // Convert to array format
        storiesByFile.forEach((stories, fileName) => {
          storiesArray.push([fileName, stories]);
        });

        // Send update to Creevey server
        const serverUrl = `http://localhost:${serverPort}/stories`;
        await fetch(serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stories: storiesArray }),
        });
      } catch (error) {
        // Silently fail - don't break Storybook if Creevey server is down
        console.warn('Failed to send story updates to Creevey:', error);
      }
    })();
  });
}
