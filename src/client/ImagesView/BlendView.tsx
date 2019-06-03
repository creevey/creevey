import React from "react";
import { css } from "@emotion/core";
import { ViewProps } from "./ImagesView";

export function BlendView({ url, actual, expect }: ViewProps) {
  return (
    <div
      css={css`
        display: inline-block;
        position: relative;
        margin: 20px;
        filter: invert(100%);
      `}
    >
      <img
        src={`${url}/${actual}`}
        css={css`
          position: absolute;
          border: 1px solid #419d14;
        `}
      />
      <img
        src={`${url}/${expect}`}
        css={css`
          vertical-align: top;
          border: 1px solid #d9472b;
          mix-blend-mode: difference;
        `}
      />
    </div>
  );
}
