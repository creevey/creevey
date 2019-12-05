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
        position: relative;
        margin: 20px;
      `}
    >
      <label
        css={css`
          position: absolute;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          cursor: pointer;
          width: 100%;
          height: 100%;
          z-index: 1;
        `}
      >
        <input
          css={css`
            display: inline-block;
            position: absolute;
            width: 0;
            height: 0;
            z-index: -1;
            appearance: none;
          `}
          type="checkbox"
          onChange={handleChangeView}
        />
        <img
          alt={image}
          src={props[image]}
          css={css`
            border: 1px solid ${colors[image]};
            max-width: 100%;
          `}
        />
      </label>
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
