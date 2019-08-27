import React from "react";
import { css } from "@emotion/core";
import { ViewProps } from "./ImagesView";

export function SideBySideView({ url, actual, diff, expect }: ViewProps) {
  return (
    <>
      <a href={`${url}/${expect}`} target="_blank">
        <img
          src={`${url}/${expect}`}
          css={css`
            margin: 20px 0;
            border: 1px solid #419d14;
            max-width: 100%;
          `}
        />
      </a>
      <a href={`${url}/${diff}`} target="_blank">
        <img
          src={`${url}/${diff}`}
          css={css`
            margin: 20px 0;
            border: 1px solid #1d85d0;
            max-width: 100%;
          `}
        />
      </a>
      <a href={`${url}/${actual}`} target="_blank">
        <img
          src={`${url}/${actual}`}
          css={css`
            margin: 20px 0;
            border: 1px solid #d9472b;
            max-width: 100%;
          `}
        />
      </a>
    </>
  );
}
