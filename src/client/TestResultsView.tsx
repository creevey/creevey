import React from "react";
import SidePage from "@skbkontur/react-ui/SidePage";
import Button from "@skbkontur/react-ui/Button";
import Paging from "@skbkontur/react-ui/Paging";
import { Test } from "./CreeveyContext";
import { TestResult } from "../types";

interface TestResultsViewProps {
  test: Test;
  onClose: () => void;
}

interface TestResultsViewState {
  activePage: number;
}

export class TestResultsView extends React.Component<TestResultsViewProps, TestResultsViewState> {
  state: TestResultsViewState = { activePage: 0 };

  render() {
    const {
      onClose,
      test: { results = {} }
    } = this.props;
    const { activePage } = this.state;
    const activeRetry = Object.keys(results).map(Number)[activePage];
    const result = results[activeRetry];
    return (
      <SidePage onClose={onClose}>
        <SidePage.Header>Title</SidePage.Header>
        <SidePage.Body>
          <SidePage.Container>
            <Paging
              activePage={activePage + 1}
              onPageChange={this.handlePageChange}
              pagesCount={Object.keys(results).length}
            />
            {result && this.renderResult(result)}
          </SidePage.Container>
        </SidePage.Body>
        <SidePage.Footer panel>
          <Button onClick={onClose}>Close</Button>
        </SidePage.Footer>
      </SidePage>
    );
  }

  private renderResult({ images }: TestResult) {
    if (!images) return null;
    const {
      test: { path }
    } = this.props;

    return Object.entries(images).map(([name, image]) => {
      if (!image) return null;

      return (
        <React.Fragment key={name}>
          <img src={this.getImageUrl(path, image.actual)} />
          {image.diff && <img src={this.getImageUrl(path, image.diff)} />}
          {image.expect && <img src={this.getImageUrl(path, image.expect)} />}
        </React.Fragment>
      );
    });
  }

  private handlePageChange = (page: number) => this.setState({ activePage: page });

  private getImageUrl = (path: string[], name: string) => `report/${path.join("/")}/${name}`;
}
