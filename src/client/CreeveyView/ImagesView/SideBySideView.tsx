import React from 'react';
import { css } from '@emotion/core';
import { ViewProps } from './ImagesView';

export function SideBySideView({ actual, diff, expect }: ViewProps): JSX.Element {
  return (
    <div
      css={css`
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-evenly;
        align-items: center;
        height: 100%;
        margin: 20px 0;
      `}
    >
      <a
        css={css`
          margin: 0 10px 0 20px;
        `}
        href={expect}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          alt="expect"
          src={expect}
          css={css`
            border: 1px solid #419d14;
            max-width: 100%;
          `}
        />
      </a>
      <a
        css={css`
          margin: 0 10px;
        `}
        href={diff}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          alt="diff"
          src={diff}
          css={css`
            border: 1px solid #1d85d0;
            max-width: 100%;
          `}
        />
      </a>
      <a
        css={css`
          margin: 0 20px 0 10px;
        `}
        href={actual}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          alt="actual"
          src={actual}
          css={css`
            border: 1px solid #d9472b;
            max-width: 100%;
          `}
        />
      </a>
    </div>
  );
}
