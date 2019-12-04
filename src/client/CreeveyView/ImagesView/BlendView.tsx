import React from 'react';
import { css } from '@emotion/core';
import { ViewProps } from './ImagesView';

export function BlendView({ actual, expect }: ViewProps): JSX.Element {
  return (
    <div
      css={css`
        margin: 20px;
        position: relative;
        filter: invert(100%);
      `}
    >
      <img
        alt="actual"
        src={actual}
        css={css`
          position: absolute;
          border: 1px solid #419d14;
          max-width: 100%;
          top: 0;
          left: 0;
        `}
      />
      <img
        alt="expect"
        src={expect}
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
