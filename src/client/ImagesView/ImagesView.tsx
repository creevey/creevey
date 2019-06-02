import React from "react";
import { css } from "@emotion/core";
import Button from "@skbkontur/react-ui/Button";
import Switcher from "@skbkontur/react-ui/Switcher";
import { TogetherView } from "./TogetherView";
import { SwapView } from "./SwapView";
import { SlideView } from "./SlideView";
import { BlendView } from "./BlendView";

export interface ViewProps {
  url: string;
  actual: string;
  diff: string;
  expect: string;
}

type ViewMode = "together" | "swap" | "slide" | "blend";

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
  together: TogetherView,
  swap: SwapView,
  slide: SlideView,
  blend: BlendView
};

const modes: ViewMode[] = ["together", "swap", "slide", "blend"];

export class ImagesView extends React.Component<ImagesViewProps, ImagesViewState> {
  public state: ImagesViewState = {
    mode: "together"
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
            <Switcher items={modes} onChange={this.handleChangeView} value={mode} />
            {diff && expect ? <ViewComponent url={url} actual={actual} diff={diff} expect={expect} /> : null}
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
