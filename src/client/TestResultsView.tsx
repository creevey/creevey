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
  activePage?: number;
}

export class TestResultsView extends React.Component<TestResultsViewProps, TestResultsViewState> {
  state: TestResultsViewState = {};

  render() {
    const {
      onClose,
      test: { results = {} }
    } = this.props;
    const retries = Object.keys(results);
    const { activePage = retries.length } = this.state;
    const activeRetry = retries.map(Number)[activePage - 1];
    const result = results[activeRetry];
    return (
      <SidePage onClose={onClose} width={1200}>
        <SidePage.Header>Title</SidePage.Header>
        <SidePage.Body>
          <SidePage.Container>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Paging activePage={activePage} onPageChange={this.handlePageChange} pagesCount={retries.length} />
              {result && this.renderResult(result)}
            </div>
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
        <div key={name} style={{ background: "#eee", textAlign: "center" }}>
          <img src={this.getImageUrl(path, image.actual)} style={{ margin: "20px", border: "1px solid #888" }} />
          {image.diff && (
            <img src={this.getImageUrl(path, image.diff)} style={{ margin: "20px", border: "1px solid #888" }} />
          )}
          {image.expect && (
            <img src={this.getImageUrl(path, image.expect)} style={{ margin: "20px", border: "1px solid #888" }} />
          )}
        </div>
      );
    });
  }

  private handlePageChange = (page: number) => this.setState({ activePage: page });

  private getImageUrl = (path: string[], name: string) => `report/${path.join("/")}/${name}`;
}
