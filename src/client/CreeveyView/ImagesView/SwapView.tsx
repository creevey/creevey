import React, { useState } from 'react';
import { css } from '@emotion/core';
import { ViewProps } from './ImagesView';

const colors: Omit<ViewProps, 'diff'> = {
  actual: '#d9472b',
  expect: '#419d14',
};

type ImageState = keyof typeof colors;

export function SwapView(props: ViewProps) {
  const [image, setImage] = useState<ImageState>('actual');

  const handleChangeView = () => setImage(image == 'actual' ? 'expect' : 'actual');

  return (
    <label
      css={css`
        display: inline-block;
        cursor: pointer;
        margin: 20px 0;
      `}
    >
      <input
        css={css`
          display: inline-block;
          position: absolute;
          width: 0;
          height: 0;
          z-index: -1;
          -webkit-appearance: none;
        `}
        type="checkbox"
        onChange={handleChangeView}
      />
      <img
        src={props[image]}
        css={css`
          border: 1px solid ${colors[image]};
          max-width: 100%;
        `}
      />
    </label>
  );
}
