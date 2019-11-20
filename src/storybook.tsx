import React from "react";
import ReactDOM from "react-dom";
import { NativeEventSource, EventSourcePolyfill } from "event-source-polyfill";
import addons, { makeDecorator, StoryContext, StoryGetter } from "@storybook/addons";
import { getStorybook, addParameters } from "@storybook/react";
import { StoriesRaw, CreeveyStoryParams, StoryInput, CreeveyStory, CreeveyStories } from "./types";

// NOTE If you don't use babel-polyfill or any other polyfills that add EventSource for IE11
// You don't get hot reload in IE11. So put polyfill for that to better UX
window.EventSource = NativeEventSource || EventSourcePolyfill;

export type StoryDidMountCallback = (context?: CreeveyStory) => void;

interface CreeveyStoryWrapperProps {
  context?: StoryContext;
  onDidMount: StoryDidMountCallback;
}

class CreeveyStoryWrapper extends React.Component<CreeveyStoryWrapperProps> {
  componentDidMount() {
    const { context, onDidMount } = this.props;

    if (!context) return onDidMount();

    onDidMount(serializeStory(context));
  }

  render() {
    return this.props.children;
  }
}

export function withCreevey(parameters: CreeveyStoryParams = {}) {
  function selectStory(storyId: string, kind: string, name: string, callback: StoryDidMountCallback) {
    storyDidMountCallback = callback;
    // NOTE Hack to trigger force re-render same story
    addons.getChannel().emit("setCurrentStory", { storyId: true, name, kind });
    setTimeout(() => addons.getChannel().emit("setCurrentStory", { storyId, name, kind }), 100);
  }
  let storyDidMountCallback: StoryDidMountCallback = () => {};
  let stories: CreeveyStories = {};

  addParameters({ creevey: parameters });

  addons.getChannel().once("setStories", (data: { stories: StoriesRaw }) => {
    Object.entries(data.stories).forEach(([storyId, story]) => {
      stories[storyId] = serializeStory(story);
    });
  });
  // @ts-ignore
  window.__CREEVEY_GET_STORIES__ = callback => callback(stories);
  // @ts-ignore
  window.__CREEVEY_SELECT_STORY__ = selectStory;

  return makeDecorator({
    name: "withCreevey",
    parameterName: "creevey",
    // TODO what data exists in settings argument?
    wrapper(getStory, context, _settings) {
      return (
        <CreeveyStoryWrapper context={context} onDidMount={storyDidMountCallback}>
          {getStory(context)}
        </CreeveyStoryWrapper>
      );
    }
  });
}

export function withCreeveyOld(parameters: CreeveyStoryParams = {}) {
  function selectStory(storyId: string, _kind: string, _name: string, callback: StoryDidMountCallback) {
    const render = storyRenders[storyId];

    ReactDOM.unmountComponentAtNode(root);

    if (render) {
      ReactDOM.render(<CreeveyStoryWrapper onDidMount={callback}>{render()}</CreeveyStoryWrapper>, root);
    }
  }
  let storyRenders: { [id: string]: Function } = {};
  const root = document.getElementById("root") as HTMLElement;

  // @ts-ignore
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
          parameters: { creevey: parameters }
        });
      });
    });

    callback(stories);
  };
  // @ts-ignore
  window.__CREEVEY_SELECT_STORY__ = selectStory;

  return (getStory: StoryGetter, context: StoryContext) => getStory(context);
}

function serializeStory(story: StoryInput | StoryContext): CreeveyStory {
  const {
    id,
    name,
    kind,
    parameters,
    // @ts-ignore prop hooks exists in runtime
    hooks
  } = story;

  const creevey: CreeveyStoryParams = parameters.creevey;
  const { __filename, _seleniumTests, ...params } = creevey;

  // TODO serialize param `skip` regexp

  // NOTE Filter stories filename if no tests
  return { id, name, kind, params: { ...params, ...(_seleniumTests ? { __filename } : {}) } };
}
