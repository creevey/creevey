import React from "react";
import { css } from "@emotion/core";
import ScrollContainer from "@skbkontur/react-ui/ScrollContainer";
import Paging from "@skbkontur/react-ui/Paging";
import Button from "@skbkontur/react-ui/Button";
import { CreeveyContex } from "../../CreeveyContext";
import { ImagesView } from "../ImagesView";
import { ResultsPageHeader } from "./ResultsPageHeader";
import { ViewMode } from "../ImagesView/ImagesView";
import { CreeveyTest } from "../../../types";

interface TestResultsViewProps {
  test: CreeveyTest;
}

interface TestResultsViewState {
  activePage?: number;
  currentImageName?: string;
  mode: ViewMode;
}

export class ResultsPage extends React.Component<TestResultsViewProps, TestResultsViewState> {
  static contextType = CreeveyContex;
  context: React.ContextType<typeof CreeveyContex> = this.context;
  state: TestResultsViewState = { mode: "side-by-side" };

  render(): React.ReactNode {
    const {
      test: { results = [], path, approved = {} }
    } = this.props;
    const imagesNames = this.getImagesNames();
    const { activePage = results.length, currentImageName = imagesNames[0] } = this.state;

    const retry = activePage - 1;
    const result = results[retry];
    // path => [kind, story, test, browser]
    const browser = path.slice(-1)[0];
    // TODO should better handle offline mode

    const image = result?.images?.[currentImageName];
    if (!image) {
      debugger;
      return `Image ${currentImageName} not found`;
    }

    const isApproved = approved[currentImageName] == retry || (result && result.status == "success");
    const imagesUrl = window.location.host ? `/report/${path.slice(0, -1).join("/")}` : path.slice(0, -1).join("/");
    const url = encodeURI(currentImageName == browser ? imagesUrl : `${imagesUrl}/${browser}`);

    return (
      <div
        css={css`
          width: 100%;
          height: 100vh;
        `}
      >
        <ResultsPageHeader
          imageName={currentImageName}
          imagesNames={imagesNames}
          diff={image.diff}
          expect={image.expect}
          mode={this.state.mode}
          handleChangeView={this.handleChangeView}
          handleImageChange={this.handleImageChange}
        />
        <div
          css={css`
            height: calc(100vh - ${image.diff && image.expect ? 145 : 110}px);
          `}
        >
          <ScrollContainer>
            <ImagesView
              key={currentImageName}
              imageName={currentImageName}
              url={url}
              actual={image.actual}
              diff={image.diff}
              expect={image.expect}
              approved={isApproved}
              mode={this.state.mode}
            />
          </ScrollContainer>
        </div>
        <div
          css={css`
            display: flex;
            flex-flow: column no-wrap;
            padding: 15px 20px;
            justify-content: space-between;
          `}
        >
          <Paging activePage={activePage} onPageChange={this.handlePageChange} pagesCount={results.length} />
          <div>
            {isApproved ? null : (
              <Button use="primary" onClick={this.handleApprove} width="100px">
                {"Approve"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // TODO Switcher should be generic
  private handleChangeView = (_: any, mode: any) => this.setState({ mode });
  private handlePageChange = (page: number) => this.setState({ activePage: page });
  private handleImageChange = (imageName: string) => this.setState({ currentImageName: imageName });

  private handleApprove = () => {
    const {
      test: { id, results = [] }
    } = this.props;
    const { activePage = results.length, currentImageName } = this.state;

    const imageName = currentImageName || this.getImagesNames()[0];
    this.context.onImageApprove(id, activePage - 1, imageName);
  };

  private getImagesNames(): string[] {
    const {
      test: { results = [] }
    } = this.props;
    const { activePage = results.length } = this.state;

    const images = results[activePage - 1]?.images;
    if (images) return Object.keys(images);
    throw "No image names to parse";
  }
}
