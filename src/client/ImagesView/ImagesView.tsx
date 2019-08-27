import React from "react";
import { css } from "@emotion/core";
import ThemeProvider from "@skbkontur/react-ui/ThemeProvider";
import Button from "@skbkontur/react-ui/Button";
import Switcher from "@skbkontur/react-ui/Switcher";
import { SideBySideView } from "./SideBySideView";
import { SwapView } from "./SwapView";
import { SlideView } from "./SlideView";
import { BlendView } from "./BlendView";
import FLAT_THEME from "@skbkontur/react-ui/lib/theming/themes/FlatTheme";

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
const SwitcherTheme = {
  ...FLAT_THEME,
  btnDefaultActiveBg: "none",
  btnDefaultHoverBg: "none",
  btnDefaultHoverBgStart: "none",
  btnDefaultHoverBgEnd: "none",
  btnDefaultBorder: "1px solid transparent",
  btnDefaultHoverBorderColor: "transparent"
};

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
          <a href={`${url}/${actual}`} target="_blank">
            <img
              src={`${url}/${actual}`}
              css={css`
                border: 1px solid #419d14;
                max-width: 100%;
              `}
            />
          </a>
        ) : (
          <>
            {diff && expect ? (
              <>
                <ThemeProvider value={SwitcherTheme}>
                  <Switcher items={modes} onChange={this.handleChangeView} value={mode} />
                </ThemeProvider>
                <ViewComponent url={url} actual={actual} diff={diff} expect={expect} />
              </>
            ) : (
              <a href={`${url}/${actual}`} target="_blank">
                <img
                  src={`${url}/${actual}`}
                  css={css`
                    border: 1px solid #419d14;
                    margin-bottom: 20px;
                    max-width: 100%;
                  `}
                />
              </a>
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
