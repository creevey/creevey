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
    const { url, actual, expect } = this.props;
    const { width, height, value } = this.state;
    return (
      <div
        css={css`
          display: inline-block;
          position: relative;
          margin: 20px;
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
            width: 100%;
            margin: 0;
            z-index: 1;
            -webkit-appearance: none;
            &::-webkit-slider-thumb {
              border-top: 1px solid transparent;
              border-bottom: 1px solid transparent;
              border-left: 1px solid #888;
              height: ${height}px;
              width: 1px;
              -webkit-appearance: none;
            }
          `}
          min="0"
          max={width}
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
            src={`${url}/${expect}`}
            css={css`
              border: 1px solid #d9472b;
              vertical-align: top;
            `}
            onLoad={this.handleImageLoad}
          />
        </div>
        <img
          src={`${url}/${actual}`}
          css={css`
            border: 1px solid #419d14;
            vertical-align: top;
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
