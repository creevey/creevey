import React from "react";
import { css } from "@emotion/core";
import { ViewProps } from "./ImagesView";

export function BlendView({ url, actual, expect }: ViewProps) {
  return (
    <div
      css={css`
        display: inline-block;
        position: relative;
        margin: 20px 0;
        filter: invert(100%);
      `}
    >
      <img
        src={`${url}/${actual}`}
        css={css`
          position: absolute;
          border: 1px solid #419d14;
          max-width: 100%;
        `}
      />
      <img
        src={`${url}/${expect}`}
        css={css`
          vertical-align: top;
          border: 1px solid #d9472b;
          max-width: 100%;
          mix-blend-mode: difference;
        `}
      />
    </div>
  );
}
