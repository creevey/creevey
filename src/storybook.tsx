import React from "react";
import addons, { makeDecorator, StoryContext } from "@storybook/addons";

type StoryDidMountCallback = (context: StoryContext) => void;

interface CreeveyStoryWrapperProps {
  context: StoryContext;
  onDidMount: StoryDidMountCallback;
}

class CreeveyStoryWrapper extends React.Component<CreeveyStoryWrapperProps> {
  componentDidMount() {
    const { context, onDidMount } = this.props;
    onDidMount(context);
  }

  render() {
    return this.props.children;
  }
}

addons.getChannel().once("setStories", ({ stories }) => {
  // @ts-ignore
  window.getStories = callback => callback(stories);
});

export function withCreevey() {
  let storyDidMountCallback: StoryDidMountCallback = () => {};
  // @ts-ignore
  window.selectStory = (storyId: string, kind: string, name: string, callback: StoryDidMountCallback) => {
    storyDidMountCallback = callback;
    addons.getChannel().emit("setCurrentStory", { storyId, name, kind });
  };

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
