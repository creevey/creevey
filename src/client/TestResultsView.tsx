import React from "react";
import SidePage from "@skbkontur/react-ui/SidePage";
import Paging from "@skbkontur/react-ui/Paging";
import { Test, CreeveyContex } from "./CreeveyContext";
import { Images } from "../types";
import { ImagesView } from "./ImagesView";

interface TestResultsViewProps {
  test: Test;
  onClose: () => void;
}

interface TestResultsViewState {
  activePage?: number;
}

export class TestResultsView extends React.Component<TestResultsViewProps, TestResultsViewState> {
  static contextType = CreeveyContex;
  context: React.ContextType<typeof CreeveyContex> = this.context;
  state: TestResultsViewState = {};

  render() {
    const {
      onClose,
      test: { results = {}, path }
    } = this.props;
    const retries = Object.keys(results);
    const { activePage = retries.length } = this.state;
    const activeRetry = retries.map(Number)[activePage - 1];
    const result = results[activeRetry];
    // TODO Output tile and image name
    return (
      <SidePage onClose={onClose} width={1200}>
        <SidePage.Header>{path.join("/")}</SidePage.Header>
        <SidePage.Body>
          <SidePage.Container>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Paging activePage={activePage} onPageChange={this.handlePageChange} pagesCount={retries.length} />
              {result && this.renderError(result.error)}
              {result && this.renderImages(result.images)}
            </div>
          </SidePage.Container>
        </SidePage.Body>
      </SidePage>
    );
  }

  private renderError(error?: string) {
    if (!error) return null;
    return <div style={{ background: "#eee", textAlign: "center" }}>{error}</div>;
  }

  private renderImages(images?: Partial<{ [name: string]: Images }>) {
    // TODO render error message
    if (!images) return null;
    const {
      test: { path }
    } = this.props;
    // TODO should better handle offline mode
    const imagesUrl = window.location.host ? `/report/${path.join("/")}` : path.join("/");

    return Object.entries(images).map(([name, image]) => {
      if (!image) return null;

      const { actual, diff, expect } = image;

      return (
        <ImagesView
          key={name}
          imageName={name}
          url={imagesUrl}
          actual={actual}
          diff={diff}
          expect={expect}
          onApprove={this.handleApprove}
        />
      );
    });
  }

  private handlePageChange = (page: number) => this.setState({ activePage: page });

  private handleApprove = (imageName: string) => {
    const {
      test: { id, results = {} }
    } = this.props;
    const retries = Object.keys(results);
    const { activePage = retries.length } = this.state;
    const activeRetry = retries.map(Number)[activePage - 1];

    this.context.onImageApprove(id, activeRetry, imageName);
  };
}
