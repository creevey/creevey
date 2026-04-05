"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectStory = selectStory;
exports.insertIgnoreStyles = insertIgnoreStyles;
exports.removeIgnoreStyles = removeIgnoreStyles;
exports.getStories = getStories;
// TODO Use StorybookEvents.STORY_RENDER_PHASE_CHANGED: `loading/rendering/completed` with storyId
// TODO Check other statuses and statuses with play function
function selectStory(storyId, callback) {
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
    const addonsChannel = () => window.__STORYBOOK_ADDONS_CHANNEL__;
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
    function isObject(x) {
        return typeof x == 'object' && x != null;
    }
    function disableAnimation() {
        window.__CREEVEY_ANIMATION_DISABLED__ = true;
        const style = document.createElement('style');
        const textNode = document.createTextNode(disableAnimationsStyles);
        style.setAttribute('type', 'text/css');
        style.appendChild(textNode);
        document.head.appendChild(style);
    }
    function waitForFontsLoaded() {
        // TODO Use document.fonts.ready instead
        const areFontsLoading = Array.from(document.fonts).some((font) => font.status == 'loading');
        if (areFontsLoading) {
            return new Promise((resolve) => {
                const fontsLoadedHandler = () => {
                    document.fonts.removeEventListener('loadingdone', fontsLoadedHandler);
                    resolve();
                };
                document.fonts.addEventListener('loadingdone', fontsLoadedHandler);
            });
        }
    }
    function catchRenderError(channel) {
        let rejectCallback;
        const promise = new Promise((_resolve, reject) => (rejectCallback = reject));
        function errorHandler({ title, description }) {
            rejectCallback({
                message: title,
                stack: description,
            });
        }
        function exceptionHandler(exception) {
            rejectCallback(exception);
        }
        function removeHandlers() {
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
    function waitForStoryRendered(channel) {
        let resolveCallback;
        const promise = new Promise((resolve) => (resolveCallback = resolve));
        function renderHandler() {
            resolveCallback();
        }
        function removeHandlers() {
            channel.off(STORYBOOK_EVENTS.STORY_FINISHED, renderHandler);
            channel.off(STORYBOOK_EVENTS.STORY_RENDERED, renderHandler);
        }
        if (window.__STORYBOOK_MODULE_CORE_EVENTS__.STORY_FINISHED) {
            channel.once(STORYBOOK_EVENTS.STORY_FINISHED, renderHandler);
        }
        else {
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
    if (!window.__CREEVEY_ANIMATION_DISABLED__)
        disableAnimation();
    const channel = addonsChannel();
    const renderPromise = waitForStoryRendered(channel);
    const errorPromise = catchRenderError(channel);
    setTimeout(() => {
        if (storyId == currentStory)
            channel.emit(STORYBOOK_EVENTS.FORCE_REMOUNT, { storyId });
        else
            channel.emit(STORYBOOK_EVENTS.SET_CURRENT_STORY, { storyId });
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
            if (callback)
                callback(null);
            window.__CREEVEY_SELECT_STORY_RESULT__ = { status: 'success' };
        }
        catch (reason) {
            // NOTE Event `STORY_THREW_EXCEPTION` triggered only in react and vue frameworks and return Error instance
            // NOTE Event `STORY_ERRORED` return error-like object without `name` field
            const errorMessage = reason instanceof Error
                ? // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                    reason.stack || reason.message
                : isObject(reason)
                    ? `${reason.message}\n    ${reason.stack}`
                    : reason;
            if (callback)
                callback(errorMessage);
            window.__CREEVEY_SELECT_STORY_RESULT__ = { status: 'error', message: errorMessage };
        }
        finally {
            renderPromise.cancel();
            errorPromise.cancel();
        }
    })();
}
function insertIgnoreStyles(ignoreSelectors) {
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
function removeIgnoreStyles(ignoreStyles) {
    ignoreStyles.remove();
}
// TODO Find a way to send stories updates to the server
async function getStories(callback) {
    function isRegExp(exp) {
        return exp instanceof RegExp;
    }
    function serializeRegExp(exp) {
        const { source, flags } = exp;
        return {
            __regexp: true,
            source,
            flags,
        };
    }
    function cloneDeepWith(value, customizer) {
        const customized = customizer(value);
        if (customized !== undefined)
            return customized;
        if (Array.isArray(value)) {
            return value.map((item) => cloneDeepWith(item, customizer));
        }
        if (value && typeof value === 'object') {
            const out = {};
            for (const [k, v] of Object.entries(value)) {
                out[k] = cloneDeepWith(v, customizer);
            }
            return out;
        }
        return value;
    }
    function serializeRawStories(stories) {
        for (const storyId in stories) {
            const story = stories[storyId];
            const creevey = story.parameters.creevey;
            if (creevey && 'skip' in creevey && creevey.skip) {
                creevey.skip = cloneDeepWith(creevey.skip, (value) => {
                    if (isRegExp(value)) {
                        return serializeRegExp(value);
                    }
                    return undefined;
                });
            }
        }
    }
    const stories = await window.__STORYBOOK_PREVIEW__.extract();
    serializeRawStories(stories);
    window.__CREEVEY_STORYBOOK_STORIES__ = stories;
    if (callback)
        callback(stories);
    return stories;
}
//# sourceMappingURL=storybook-helpers.js.map