import type { Channel } from 'storybook/internal/channels';
import type { Renderer } from 'storybook/internal/types';
import type { PreviewWeb, StoryStore } from 'storybook/preview-api';
import type { SerializedRegExp } from '../shared/serializeRegExp.js';
import type { CreeveyStoryParams, StoriesRaw, StorybookGlobals, StoryInput } from '../types.js';

declare global {
  interface Window {
    __CREEVEY_ANIMATION_DISABLED__: boolean;
    __CREEVEY_SESSION_ID__: string;
    __CREEVYE_STORYBOOK_READY__: boolean;
    __CREEVEY_STORYBOOK_STORIES__: undefined | StoriesRaw;
    __CREEVEY_STORYBOOK_GLOBALS__: undefined | StorybookGlobals;
    __CREEVEY_SELECT_STORY_RESULT__: null | { status: 'success' } | { status: 'error'; message: string };
    __CREEVEY_EMIT_STORIES_UPDATE__: (stories: [string, StoryInput[]][]) => void;
    __CREEVEY_PENDING_STORIES_UPDATE__: [string, StoryInput[]][] | null;
    __CREEVEY_ON_STORIES_UPDATE__: (stories: [string, StoryInput[]][]) => void;
    __STORYBOOK_ADDONS_CHANNEL__: Channel;
    __STORYBOOK_MODULE_CORE_EVENTS__: Record<string, string>;
    __STORYBOOK_PREVIEW__: PreviewWeb<Renderer>;
    __STORYBOOK_STORE__: StoryStore<Renderer>;
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
 * Watches for Storybook story changes and updates the global stories variable
 */
export function watchStories(): void {
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
  let storiesChanged = false;

  // Listen for story updates from Storybook HMR
  channel.on(STORYBOOK_EVENTS.SET_STORIES, () => {
    storiesChanged = true;
  });

  // Poll for story changes every 1 second
  setInterval(() => {
    if (storiesChanged) {
      storiesChanged = false;
      void (async () => {
        try {
          const stories = await window.__STORYBOOK_PREVIEW__.extract();
          serializeRawStories(stories);
          window.__CREEVEY_STORYBOOK_STORIES__ = stories;
          console.debug('Creevey: Stories updated via polling');
        } catch (error) {
          console.warn('Failed to update stories:', error);
        }
      })();
    }
  }, 1000);
}

/**
 * Monitors story changes and emits update messages to the server
 */
export function monitorStoryChanges(): void {
  let lastStoriesHash: string | null = null;

  // Check for story changes every 500ms
  setInterval(() => {
    (() => {
      try {
        const currentStories = window.__CREEVEY_STORYBOOK_STORIES__;
        if (!currentStories) return;

        // Create a simple hash to detect changes
        const storiesJson = JSON.stringify(Object.keys(currentStories).sort());
        const currentHash = storiesJson;

        if (lastStoriesHash !== currentHash) {
          lastStoriesHash = currentHash;

          // Convert stories to array format expected by server
          const storiesArray: [string, StoryInput[]][] = [];
          const storiesByFile = new Map<string, StoryInput[]>();

          // Group stories by file
          for (const storyId in currentStories) {
            const story = currentStories[storyId];
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

          // Emit update message to server
          if (typeof window.__CREEVEY_EMIT_STORIES_UPDATE__ === 'function') {
            window.__CREEVEY_EMIT_STORIES_UPDATE__(storiesArray);
          } else {
            // For Selenium, store the update for polling
            window.__CREEVEY_PENDING_STORIES_UPDATE__ = storiesArray;
          }
        }
      } catch (error) {
        console.warn('Failed to monitor story changes:', error);
      }
    })();
  }, 500);
}
