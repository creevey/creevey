import React from "react";
import { css } from "@emotion/core";
import Button from "@skbkontur/react-ui/Button";
import Switcher from "@skbkontur/react-ui/Switcher";
import { SideBySideView } from "./SideBySideView";
import { SwapView } from "./SwapView";
import { SlideView } from "./SlideView";
import { BlendView } from "./BlendView";

export interface ViewProps {
  url: string;
  actual: string;
  diff: string;
  expect: string;
}

type ViewMode = "side-by-side" | "swap" | "slide" | "blend";

interface ImagesViewProps {
  imageName: string;
  url: string;
  actual: string;
  diff?: string;
  expect?: string;
  approved: boolean;
  onApprove: (imageName: string) => void;
}

interface ImagesViewState {
  mode: ViewMode;
}

const views = {
  "side-by-side": SideBySideView,
  swap: SwapView,
  slide: SlideView,
  blend: BlendView
};

const modes: ViewMode[] = ["side-by-side", "swap", "slide", "blend"];

export class ImagesView extends React.Component<ImagesViewProps, ImagesViewState> {
  public state: ImagesViewState = {
    mode: "side-by-side"
  };
  render() {
    const { url, actual, diff, expect, approved } = this.props;
    const { mode } = this.state;
    const ViewComponent = views[mode];
    return (
      <div
        css={css`
          background: #eee;
          text-align: center;
          padding: 20px;
        `}
      >
        {approved ? (
          <img
            src={`${url}/${actual}`}
            css={css`
              border: 1px solid #419d14;
            `}
          />
        ) : (
          <>
            {diff && expect ? (
              <>
                <Switcher items={modes} onChange={this.handleChangeView} value={mode} />
                <ViewComponent url={url} actual={actual} diff={diff} expect={expect} />
              </>
            ) : (
              <img
                src={`${url}/${actual}`}
                css={css`
                  border: 1px solid #419d14;
                  margin-bottom: 20px;
                `}
              />
            )}
            <div>
              <Button use="primary" onClick={this.handleApprove} width="100px">
                {"Approve"}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // TODO Switcher should be generic
  private handleChangeView = (_: any, mode: any) => this.setState({ mode });

  private handleApprove = () => this.props.onApprove(this.props.imageName);
}
