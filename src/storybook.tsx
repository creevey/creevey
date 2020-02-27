import React, { ReactNode } from 'react';
import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';
import Events from '@storybook/core-events';
import addons, { makeDecorator, StoryContext, MakeDecoratorResult } from '@storybook/addons';
import { addParameters } from '@storybook/react';
import { CreeveyStoryParams, CreeveyStory, noop } from './types';

// NOTE If you don't use babel-polyfill or any other polyfills that add EventSource for IE11
// You don't get hot reload in IE11. So put polyfill for that to better UX
window.EventSource = NativeEventSource || EventSourcePolyfill;

declare global {
  interface Window {
    __CREEVEY_SELECT_STORY__: (storyId: string, kind: string, name: string, callback: Function) => void;
  }
}

export type StoryDidMountCallback = (context?: CreeveyStory) => void;

interface CreeveyStoryWrapperProps {
  context?: StoryContext;
  onDidMount: Function;
}

class CreeveyStoryWrapper extends React.Component<CreeveyStoryWrapperProps> {
  componentDidMount(): void {
    const { context, onDidMount } = this.props;

    if (!context) return onDidMount();

    onDidMount();
  }

  render(): ReactNode {
    return this.props.children;
  }
}

export function withCreevey(parameters: CreeveyStoryParams = {}): MakeDecoratorResult {
  let storyDidMountCallback: Function = noop;

  function selectStory(storyId: string, kind: string, name: string, callback: Function): void {
    storyDidMountCallback = callback;
    // NOTE Hack to trigger force re-render same story
    addons.getChannel().emit(Events.SET_CURRENT_STORY, { storyId: true, name, kind });
    setTimeout(() => addons.getChannel().emit(Events.SET_CURRENT_STORY, { storyId, name, kind }), 100);
  }

  addParameters({ creevey: parameters });

  window.__CREEVEY_SELECT_STORY__ = selectStory;

  return makeDecorator({
    name: 'withCreevey',
    parameterName: 'creevey',
    wrapper(getStory, context) {
      return (
        <CreeveyStoryWrapper context={context} onDidMount={storyDidMountCallback}>
          {getStory(context)}
        </CreeveyStoryWrapper>
      );
    },
  });
}
