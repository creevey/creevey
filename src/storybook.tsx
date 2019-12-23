import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';
import addons, { makeDecorator, StoryContext, StoryGetter, MakeDecoratorResult } from '@storybook/addons';
import { getStorybook, addParameters } from '@storybook/react';
import { StoriesRaw, CreeveyStoryParams, StoryInput, CreeveyStory, CreeveyStories, SkipOption, noop } from './types';

// NOTE If you don't use babel-polyfill or any other polyfills that add EventSource for IE11
// You don't get hot reload in IE11. So put polyfill for that to better UX
window.EventSource = NativeEventSource || EventSourcePolyfill;

declare global {
  interface Window {
    __CREEVEY_GET_STORIES__: (callback: (stories: string) => void) => void;
    __CREEVEY_SELECT_STORY__: (storyId: string, kind: string, name: string, callback: StoryDidMountCallback) => void;
  }
}

function serializeSkip(skip: SkipOption): SkipOption {
  const { reason } = skip;
  let { in: browsers, kinds, stories } = skip;

  if (browsers instanceof RegExp) browsers = browsers.toString();
  if (kinds instanceof RegExp) kinds = kinds.toString();
  if (stories instanceof RegExp) stories = stories.toString();

  return { reason, in: browsers, kinds, stories };
}

function serializeStory(story: StoryInput | StoryContext): CreeveyStory {
  const { id, name, kind, parameters } = story;

  const creevey: CreeveyStoryParams = parameters.creevey;
  const { __filename, _seleniumTests, skip, ...params } = creevey;

  // NOTE Filter stories filename if no tests
  return {
    id,
    name,
    kind,
    params: {
      ...params,
      ...(_seleniumTests ? { __filename } : {}),
      ...(!skip || typeof skip == 'string'
        ? { skip }
        : { skip: Array.isArray(skip) ? skip.map(serializeSkip) : serializeSkip(skip) }),
    },
  };
}

export type StoryDidMountCallback = (context?: CreeveyStory) => void;

interface CreeveyStoryWrapperProps {
  context?: StoryContext;
  onDidMount: StoryDidMountCallback;
}

class CreeveyStoryWrapper extends React.Component<CreeveyStoryWrapperProps> {
  componentDidMount(): void {
    const { context, onDidMount } = this.props;

    if (!context) return onDidMount();

    onDidMount(serializeStory(context));
  }

  render(): ReactNode {
    return this.props.children;
  }
}

export function withCreevey(parameters: CreeveyStoryParams = {}): MakeDecoratorResult {
  let storyDidMountCallback: StoryDidMountCallback = noop;

  function selectStory(storyId: string, kind: string, name: string, callback: StoryDidMountCallback): void {
    storyDidMountCallback = callback;
    // NOTE Hack to trigger force re-render same story
    addons.getChannel().emit('setCurrentStory', { storyId: true, name, kind });
    setTimeout(() => addons.getChannel().emit('setCurrentStory', { storyId, name, kind }), 100);
  }
  const stories: CreeveyStories = {};

  addParameters({ creevey: parameters });

  addons.getChannel().once('setStories', (data: { stories: StoriesRaw }) => {
    Object.entries(data.stories).forEach(([storyId, story]) => {
      stories[storyId] = serializeStory(story);
    });
  });

  window.__CREEVEY_GET_STORIES__ = callback => callback(JSON.stringify(stories));
  window.__CREEVEY_SELECT_STORY__ = selectStory;

  return makeDecorator({
    name: 'withCreevey',
    parameterName: 'creevey',
    // TODO what data exists in settings argument?
    wrapper(getStory, context) {
      return (
        <CreeveyStoryWrapper context={context} onDidMount={storyDidMountCallback}>
          {getStory(context)}
        </CreeveyStoryWrapper>
      );
    },
  });
}

export function withCreeveyOld(parameters: CreeveyStoryParams = {}): MakeDecoratorResult {
  const storyRenders: { [id: string]: Function } = {};
  const root = document.getElementById('root') as HTMLElement;

  function selectStory(storyId: string, _kind: string, _name: string, callback: StoryDidMountCallback): void {
    const render = storyRenders[storyId];

    ReactDOM.unmountComponentAtNode(root);

    if (render) {
      ReactDOM.render(<CreeveyStoryWrapper onDidMount={callback}>{render()}</CreeveyStoryWrapper>, root);
    }
  }

  window.__CREEVEY_GET_STORIES__ = callback => {
    const stories: CreeveyStories = {};
    getStorybook().forEach(kind => {
      kind.stories.forEach(story => {
        const storyId = `${kind.kind}--${story.name}`.toLowerCase();
        storyRenders[storyId] = story.render;
        stories[storyId] = serializeStory({
          id: storyId,
          name: story.name,
          kind: kind.kind,
          parameters: { creevey: parameters },
        });
      });
    });

    callback(JSON.stringify(stories));
  };

  window.__CREEVEY_SELECT_STORY__ = selectStory;

  return (getStory: StoryGetter, context: StoryContext) => getStory(context);
}
