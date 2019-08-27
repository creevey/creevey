import React from "react";
import { css } from "@emotion/core";
import { ViewProps } from "./ImagesView";

const colors = {
  actual: "#d9472b",
  expect: "#419d14"
};

interface SwapViewState {
  image: "actual" | "expect";
}

export class SwapView extends React.Component<ViewProps, SwapViewState> {
  public state: SwapViewState = { image: "actual" };
  render() {
    const { url } = this.props;
    const { image } = this.state;
    return (
      <label
        css={css`
          display: inline-block;
          cursor: pointer;
          margin: 20px 0;
        `}
      >
        <input
          css={css`
            display: inline-block;
            position: absolute;
            width: 0;
            height: 0;
            z-index: -1;
          `}
          type="checkbox"
          onChange={this.handleChangeView}
        />
        <img
          src={`${url}/${this.props[image]}`}
          css={css`
            border: 1px solid ${colors[image]};
            max-width: 100%;
          `}
        />
      </label>
    );
  }

  private handleChangeView = () => this.setState(({ image }) => ({ image: image == "actual" ? "expect" : "actual" }));
}
