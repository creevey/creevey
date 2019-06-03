import React from "react";
import { css } from "@emotion/core";
import { ViewProps } from "./ImagesView";

export function SideBySideView({ url, actual, diff, expect }: ViewProps) {
  return (
    <>
      <img
        src={`${url}/${actual}`}
        css={css`
          margin: 20px;
          border: 1px solid #419d14;
        `}
      />
      <img
        src={`${url}/${diff}`}
        css={css`
          margin: 20px;
          border: 1px solid #1d85d0;
        `}
      />
      <img
        src={`${url}/${expect}`}
        css={css`
          margin: 20px;
          border: 1px solid #d9472b;
        `}
      />
    </>
  );
}
