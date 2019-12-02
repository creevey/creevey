import React from "react";
import { css } from "@emotion/core";
import { ViewProps } from "./ImagesView";

interface SlideViewState {
  width: number;
  height: number;
  value: string;
}

export class SlideView extends React.Component<ViewProps, SlideViewState> {
  public state: SlideViewState = {
    width: 0,
    height: 0,
    value: "0"
  };
  render() {
    const { actual, expect } = this.props;
    const { width, height, value } = this.state;
    return (
      <div
        css={css`
          display: inline-block;
          position: relative;
          margin: 20px 0;
          max-width: 100%;
        `}
      >
        <input
          type="range"
          css={css`
            position: absolute;
            cursor: ew-resize;
            background: none;
            outline: none;
            height: 100%;
            width: calc(100% + 2px); /* compensate borders */
            margin: 0;
            z-index: 1;
            -webkit-appearance: none;
            &::-webkit-slider-thumb {
              box-shadow: 0 0 0 0.5px #888;
              height: ${height}px;
              width: 0px;
              -webkit-appearance: none;
            }
          `}
          min="0"
          max={width + 2} /* compensate borders */
          defaultValue={value}
          onChange={this.handleSlide}
        />
        <div
          css={css`
            overflow: hidden;
            position: absolute;
            width: ${value}px;
          `}
        >
          <img
            src={expect}
            css={css`
              border: 1px solid #419d14;
              vertical-align: top;
              width: ${width}px;
            `}
            onLoad={this.handleImageLoad}
          />
        </div>
        <img
          src={actual}
          css={css`
            border: 1px solid #d9472b;
            vertical-align: top;
            max-width: 100%;
          `}
          onLoad={this.handleImageLoad}
        />
      </div>
    );
  }

  private handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = event.currentTarget;
    this.setState({ width, height });
  };

  private handleSlide = (event: React.ChangeEvent<HTMLInputElement>) => this.setState({ value: event.target.value });
}
