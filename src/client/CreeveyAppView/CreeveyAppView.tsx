import * as React from "react";
import { TestTree } from "./SideBar/TestTree";
import { css } from "@emotion/core";
import { SideBar } from "./SideBar/SideBar";
import { ResultsPage } from "./ResultsPage/ResultsPage";
import { isTest, CreeveySuite, CreeveyTest } from "../../types";

interface CreeveyAppViewProps {
  title: string;
  tests: CreeveySuite;
  onImageApprove: (id: string, retry: number, image: string) => void;
  stop: () => void;
  start: (tests: CreeveySuite) => void;
  isRunning: boolean;
  openedTest?: CreeveyTest;
}
interface TestViewAppState {
  openedTestId: string | null;
  filter: string | null;
}

export class CreeveyAppView extends React.Component<CreeveyAppViewProps, TestViewAppState> {
  state: TestViewAppState = {
    openedTestId: null,
    filter: null
  };

  public render(): React.ReactNode {
    const tests = this.filterTests();

    return (
      <div
        css={css`
          display: flex;
          flex-flow: column no-wrap;
        `}
      >
        <SideBar
          onStart={() => this.props.start(tests)}
          onStop={this.props.stop}
          onFilterChange={this.handleFilterChange}
          isRunning={this.props.isRunning}
        >
          <TestTree title={this.props.title} tests={tests} />
        </SideBar>
        {this.props.openedTest ? <ResultsPage test={this.props.openedTest} /> : null}
      </div>
    );
  }
  private filterTests(): CreeveySuite {
    if (!this.state.filter) {
      return this.props.tests;
    }

    return {
      ...this.props.tests,
      children: filterChildren(this.state.filter.toLowerCase(), this.props.tests.children)
    };
  }

  public handleFilterChange = (filter: string) => this.setState({ filter: filter });
}

function filterChildren(
  filter: string,
  children: { [title: string]: CreeveySuite | CreeveyTest }
): { [title: string]: CreeveySuite | CreeveyTest } {
  const nextChildren: { [title: string]: CreeveySuite | CreeveyTest } = {};

  for (const [title, suiteOrTest] of Object.entries(children)) {
    if (title.toLowerCase().includes(filter)) {
      nextChildren[title] = suiteOrTest;
    } else if (!isTest(suiteOrTest)) {
      const children = filterChildren(filter, suiteOrTest.children);
      if (Object.keys(children).length) {
        nextChildren[title] = { ...suiteOrTest, children: children };
      }
    } else {
      if (suiteOrTest.results?.some(result => result.status.includes(filter))) {
        nextChildren[title] = suiteOrTest;
      }
    }
  }

  return nextChildren;
}
