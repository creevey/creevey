import React, { useState } from 'react';
import { css } from '@emotion/core';
import { ViewProps } from './ImagesView';

export function SlideView({ actual, diff, expect }: ViewProps): JSX.Element {
  const [step, setStep] = useState(0);
  const [offset, setOffset] = useState(0);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>): void =>
    setStep(100 / (event.currentTarget.width + 2));

  const handleSlide = (event: React.ChangeEvent<HTMLInputElement>): void => setOffset(Number(event.target.value));

  return (
    <div
      css={css`
        position: relative;
        margin: 20px;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
      `}
    >
      <input
        type="range"
        css={css`
          position: absolute;
          cursor: ew-resize;
          background: none;
          box-shadow: none;
          outline: none;
          height: 100%;
          width: 100%;
          margin: 0;
          z-index: 1;
          appearance: none;

          &::-webkit-slider-runnable-track {
            height: 100%;
          }
          &::-webkit-slider-thumb {
            box-shadow: 0 0 0 0.5px #888;
            height: 100%;
            width: 0px;
            appearance: none;
          }

          &::-moz-focus-outer {
            border: 0;
          }
          &::-moz-range-track {
            height: 0;
          }
          &::-moz-range-thumb {
            border: none;
            box-shadow: 0 0 0 0.5px #888;
            height: 100%;
            width: 0px;
          }
          /* &::-ms-thumb {
            border: none;
            background: none;
            box-shadow: 0 0 0 0.5px #888;
            height: 100%;
            width: 0px;
            appearance: none;
          } */
        `}
        min={0}
        max={100}
        step={step}
        defaultValue={offset}
        onChange={handleSlide}
      />
      <div
        css={css`
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        `}
      >
        <div
          css={css`
            position: relative;
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
              border: 1px solid #d9472b;
              background: #fff;
              max-width: 100%;
            `}
          />
        </div>
      </div>
      <div
        css={css`
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #eee;
        `}
        style={{ right: `${100 - offset}%` }}
      >
        <div
          css={css`
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
          `}
          style={{ left: `${100 - offset}%` }}
        >
          <img
            alt="expect"
            src={expect}
            css={css`
              border: 1px solid #419d14;
              background: #fff;
              max-width: 100%;
            `}
          />
        </div>
      </div>
      <img
        alt="diff"
        src={diff}
        css={css`
          max-width: 100%;
          opacity: 0;
          border: 1px solid transparent;
        `}
        onLoad={handleImageLoad}
      />
    </div>
  );
}
