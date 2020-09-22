import React, { ComponentClass } from 'react';
import { STORY_RENDERED } from '@storybook/core-events';
import { API } from '@storybook/api';
import { initCreeveyClientApi, CreeveyClientApi } from '../utils/creeveyClientApi';
import { Test, isDefined, CreeveyStatus, CreeveyUpdate } from '../types';
import { produce } from 'immer';
import { CreeveyContext } from './CreeveyContext';

export interface CreeveyTestsProviderProps {
  active?: boolean;
  api: API;
}

export interface CreeveyTestsProviderState {
  status: CreeveyStatus;
  storyId: string;
  isRunning: boolean;
}
interface ChildProps extends CreeveyTestsProviderProps {
  statuses: Test[];
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
    async componentDidMount(): Promise<void> {
      const { api } = this.props;
      this.creeveyApi = await initCreeveyClientApi();
      const status = await this.creeveyApi.status;
      this.setState({
        status: status,
      });
      this.creeveyApi?.onUpdate(({ tests, removedTests = [], isRunning }: CreeveyUpdate) => {
        if (isDefined(isRunning)) {
          this.setState({ isRunning });
        }
        if (isDefined(tests))
          this.setState(
            produce((draft: CreeveyTestsProviderState) => {
              const prevTests = draft.status.tests;
              Object.entries(tests).forEach(([id, update]) => {
                if (!prevTests[id]) {
                  prevTests[id] = { id: id, path: update?.path ?? [], skip: update?.skip ?? false };
                }
                let test = prevTests[id];
                if (test && removedTests.includes(test.path)) {
                  test = undefined;
                  return;
                }
                if (!update || !test) return;
                const { skip, status, results, approved } = update;
                if (isDefined(skip)) test.skip = skip;
                if (isDefined(status)) test.status = status;
                if (isDefined(results)) test.results ? test.results.push(...results) : (test.results = results);
                if (isDefined(approved))
                  Object.entries(approved).forEach(
                    ([image, retry]) =>
                      retry !== undefined && test && ((test.approved = test?.approved || {})[image] = retry),
                  );
              });
            }),
          );
      }),
        api.on(STORY_RENDERED, this.onStoryRendered);
    }

    componentWillUnmount(): void {
      const { api } = this.props;
      api.off(STORY_RENDERED, this.onStoryRendered);
    }

    onStoryRendered = (storyId: string): void => {
      this.setState({ storyId: storyId });
    };

    getStoryStatus = (): Test[] => {
      const { status, storyId } = this.state;
      if (!status || !status.tests) return [];
      return Object.values(status.tests)
        .filter((result) => result?.storyId === storyId)
        .filter(isDefined);
    };

    handleImageApprove = (id: string, retry: number, image: string): void => this.creeveyApi?.approve(id, retry, image);

    handleStart = (ids: string[]): void => this.creeveyApi?.start(ids);
    handleStop = (): void => this.creeveyApi?.stop();
    render(): JSX.Element | null {
      return this.props.active ? (
        <CreeveyContext.Provider
          value={{
            isRunning: this.state.isRunning,
            onStart: this.handleStart,
            onStop: this.handleStop,
            onImageApprove: this.handleImageApprove,
          }}
        >
          <Child statuses={this.getStoryStatus()} {...this.props} />
        </CreeveyContext.Provider>
      ) : null;
    }
  };
}
