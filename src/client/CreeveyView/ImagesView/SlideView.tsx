import React, { useState } from 'react';
import { css } from '@emotion/core';
import { ViewProps } from './ImagesView';

export function SlideView({ actual, expect }: ViewProps) {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [value, setValue] = useState('0');

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = event.currentTarget;
    setWidth(width);
    setHeight(height);
  };
  const handleSlide = (event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value);

  return (
    <div
      css={css`
        display: inline-block;
        position: relative;
        margin: 20px 0;
        max-width: 100%;
      `}
    >
      <input
        type="range"
        css={css`
          position: absolute;
          cursor: ew-resize;
          background: none;
          outline: none;
          height: 100%;
          width: calc(100% + 2px); /* compensate borders */
          margin: 0;
          z-index: 1;
          -webkit-appearance: none;
          &::-webkit-slider-thumb {
            box-shadow: 0 0 0 0.5px #888;
            height: ${height}px;
            width: 0px;
            -webkit-appearance: none;
          }
        `}
        min="0"
        max={width + 2} /* compensate borders */
        defaultValue={value}
        onChange={handleSlide}
      />
      <div
        css={css`
          overflow: hidden;
          position: absolute;
        `}
        style={{ width: `${value}px` }}
      >
        <img
          src={expect}
          css={css`
            border: 1px solid #419d14;
            vertical-align: top;
          `}
          style={{ width: `${width}px` }}
          onLoad={handleImageLoad}
        />
      </div>
      <img
        src={actual}
        css={css`
          border: 1px solid #d9472b;
          vertical-align: top;
          max-width: 100%;
        `}
        onLoad={handleImageLoad}
      />
    </div>
  );
}
