import React, { ComponentClass } from 'react';
import { SET_STORIES, STORY_RENDERED } from '@storybook/core-events';
import { API } from '@storybook/api';
import { initCreeveyClientApi, CreeveyClientApi } from '../shared/creeveyClientApi';
import { TestData, isDefined, CreeveyStatus, CreeveyUpdate, SetStoriesData, StoriesRaw, TestStatus } from '../../types';
import { produce } from 'immer';
import { CreeveyContext } from './CreeveyContext';
import { calcStatus } from '../shared/helpers';
import { Placeholder } from '@storybook/components';

export interface CreeveyTestsProviderProps {
  active?: boolean;
  api: API;
}

export interface CreeveyTestsProviderState {
  status: CreeveyStatus;
  storyId: string;
  stories?: StoriesRaw;
  isRunning: boolean;
}
interface ChildProps extends CreeveyTestsProviderProps {
  statuses: TestData[];
}

export function withCreeveyTests(
  Child: React.ComponentType<ChildProps>,
): ComponentClass<CreeveyTestsProviderProps, CreeveyTestsProviderState> {
  return class extends React.Component<CreeveyTestsProviderProps, CreeveyTestsProviderState> {
    static displayName = `withCreeveyTests(${Child.displayName || Child.name})`;
    creeveyApi: CreeveyClientApi | undefined;
    state: CreeveyTestsProviderState = {
      status: { isRunning: false, tests: {} },
      storyId: '',
      isRunning: false,
    };

    // TODO Check where path is used

    componentDidUpdate(_: CreeveyTestsProviderProps, prevState: CreeveyTestsProviderState): void {
      if (prevState.stories != this.state.stories && this.state.stories) {
        void this.props.api.setStories(this.state.stories);
      }
    }

    async componentDidMount(): Promise<void> {
      const { api } = this.props;
      try {
        this.creeveyApi = await initCreeveyClientApi();
        const status = await this.creeveyApi.status;
        this.setState({
          status: status,
        });
      } catch (_) {
        /* NOTE: Couldn't init Creevey API, just ignore the error */
      }
      this.creeveyApi?.onUpdate(({ tests, removedTests = [], isRunning }: CreeveyUpdate) => {
        if (isDefined(isRunning)) {
          this.setState({ isRunning });
        }
        if (isDefined(tests)) {
          this.setState(
            produce((draft: CreeveyTestsProviderState) => {
              const prevTests = draft.status.tests;
              const prevStories = draft.stories || {};
              Object.values(tests)
                .filter(isDefined)
                .forEach((update) => {
                  const { id, skip, status, results, approved, storyId } = update;
                  const test = prevTests[id];
                  if (!test) {
                    return (prevTests[id] = update);
                  }
                  if (isDefined(skip)) test.skip = skip;
                  if (isDefined(status)) {
                    test.status = status;
                    if (isDefined(storyId) && isDefined(prevStories[storyId])) {
                      const story = prevStories[storyId];
                      const storyStatus = this.getStoryStatus(storyId);
                      const oldStatus = storyStatus
                        .map((x) => (x.id === id ? status : x.status))
                        .reduce((oldStatus, newStatus) => calcStatus(oldStatus, newStatus), undefined);

                      story.name = this.addStatus(story.name, calcStatus(oldStatus, status), skip || false);
                    }
                  }
                  if (isDefined(results)) test.results ? test.results.push(...results) : (test.results = results);
                  if (isDefined(approved)) {
                    Object.entries(approved).forEach(
                      ([image, retry]) =>
                        retry !== undefined && test && ((test.approved = test?.approved || {})[image] = retry),
                    );
                  }
                });
              removedTests.forEach(({ id }) => delete prevTests[id]);
            }),
          );
        }
      });
      api.on(STORY_RENDERED, this.onStoryRendered);
      api.on(SET_STORIES, this.addStatusesToSidebar);
    }

    componentWillUnmount(): void {
      const { api } = this.props;
      api.off(STORY_RENDERED, this.onStoryRendered);
      api.off(SET_STORIES, this.addStatusesToSidebar);
    }
    addStatusesToSidebar = ({ stories }: SetStoriesData): void => {
      this.setState({ stories: stories });
      Object.keys(stories).forEach((storyId) => {
        const storyStatus = this.getStoryStatus(storyId);
        const status = storyStatus
          .map((x) => x.status)
          .reduce((oldStatus, newStatus) => calcStatus(oldStatus, newStatus), undefined);
        const skip = storyStatus.length > 0 ? storyStatus.every((x) => x.skip) : false;
        stories[storyId].name = this.addStatus(stories[storyId].name, status, skip);
      });
      void this.props.api.setStories(stories);
    };

    addStatus(name: string, status: TestStatus | undefined, skip: string | boolean): string {
      name = name.replace(/^(❌|✔|🟡|🕗|⏸) /, '');
      return `${getEmojiByTestStatus(status, skip)} ${name}`;
    }

    onStoryRendered = (storyId: string): void => {
      this.setState({ storyId: storyId });
    };

    getStoryStatus = (storyId: string): TestData[] => {
      const { status } = this.state;
      if (!status || !status.tests) return [];
      return Object.values(status.tests)
        .filter((result) => result?.storyId === storyId)
        .filter(isDefined);
    };

    handleImageApprove = (id: string, retry: number, image: string): void => this.creeveyApi?.approve(id, retry, image);

    handleStart = (ids: string[]): void => this.creeveyApi?.start(ids);

    handleStartAllTests = (): void => {
      const allIds = Object.keys(this.state.status.tests);
      this.creeveyApi?.start(allIds);
    };
    handleStop = (): void => this.creeveyApi?.stop();
    render(): JSX.Element | null {
      const statuses = this.getStoryStatus(this.state.storyId);
      return this.props.active ? (
        <CreeveyContext.Provider
          value={{
            isRunning: this.state.isRunning,
            onStart: this.handleStart,
            onStartAllTests: this.handleStartAllTests,
            onStop: this.handleStop,
            onImageApprove: this.handleImageApprove,
          }}
        >
          {statuses.length ? (
            <Child key={this.state.storyId} statuses={statuses} {...this.props} />
          ) : (
            <Placeholder>{`Can't connect to Creevey server by 'http://${window.location.hostname}:${__CREEVEY_SERVER_PORT__}'. Please, make sure that you start it.`}</Placeholder>
          )}
        </CreeveyContext.Provider>
      ) : null;
    }
  };
}

export function getEmojiByTestStatus(status: TestStatus | undefined, skip: string | boolean = false): string {
  switch (status) {
    case 'failed': {
      return '❌';
    }
    case 'success': {
      return '✔';
    }
    case 'running': {
      return '🟡';
    }
    case 'pending': {
      return '🕗';
    }
    default: {
      if (skip) return '⏸';
      return '';
    }
  }
}
