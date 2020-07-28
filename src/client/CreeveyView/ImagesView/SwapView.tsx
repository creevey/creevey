import React, { useState } from 'react';
import { css } from '@emotion/core';
import { ViewProps } from './ImagesView';

const colors: Omit<ViewProps, 'diff'> = {
  actual: '#d9472b',
  expect: '#419d14',
};

type ImageState = keyof typeof colors;

export function SwapView(props: ViewProps): JSX.Element {
  const [image, setImage] = useState<ImageState>('actual');

  const handleChangeView = (): void => setImage(image == 'actual' ? 'expect' : 'actual');

  return (
    <div
      css={css`
        margin: 20px;
        position: relative;
      `}
    >
      <button
        css={css`
          position: absolute;
          width: 100%;
          height: 100%;
          appearance: none;
          background: none;
          color: inherit;
          border: none;
          padding: 0;
          font: inherit;
          cursor: pointer;
          outline: none;
          z-index: 1;
        `}
        onClick={handleChangeView}
      >
        <img
          alt={image}
          src={props[image]}
          css={css`
            border: 1px solid ${colors[image]};
            max-width: 100%;
          `}
        />
      </button>
      <img
        alt="diff"
        src={props.diff}
        css={css`
          max-width: 100%;
          opacity: 0;
          border: 1px solid transparent;
        `}
      />
    </div>
  );
}
