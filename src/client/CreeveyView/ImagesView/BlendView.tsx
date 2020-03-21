import React from 'react';
import { css } from '@emotion/core';
import { ViewProps } from './ImagesView';

export function BlendView({ actual, diff, expect }: ViewProps): JSX.Element {
  return (
    <div
      css={css`
        margin: 20px;
        position: relative;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        filter: invert(100%);
      `}
    >
      <div
        css={css`
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
        `}
      >
        <img
          alt="actual"
          src={actual}
          css={css`
            border: 1px solid #419d14;
            max-width: 100%;
            filter: invert(100%);
          `}
        />
      </div>
      <div
        css={css`
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
        `}
      >
        <img
          alt="expect"
          src={expect}
          css={css`
            border: 1px solid #d9472b;
            max-width: 100%;
            filter: invert(100%);
            mix-blend-mode: difference;
          `}
        />
      </div>
      <img
        alt="diff"
        src={diff}
        css={css`
          max-width: 100%;
          opacity: 0;
          border: 1px solid transparent;
        `}
      />
    </div>
  );
}
