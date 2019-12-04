import React, { useState, useEffect, useRef } from 'react';
import { css } from '@emotion/core';
import { ViewProps } from './ImagesView';
import Loader from '@skbkontur/react-ui/Loader';

export function SlideView({ actual, expect }: ViewProps): JSX.Element {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [value, setValue] = useState('0');
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const imageLoader = (source: string): Promise<HTMLImageElement> =>
      new Promise(resolve => {
        const image = new Image();
        image.src = source;
        image.onload = () => resolve(image);
      });
    Promise.all([imageLoader(actual), imageLoader(expect)]).then(([actualImage, expectImage]) => {
      const minWidth = Math.min(actualImage.width, expectImage.width);
      actualImage.width = minWidth;
      expectImage.width = minWidth;
      const maxHeight = Math.max(actualImage.height, expectImage.height);
      setHeight(maxHeight);
      setWidth(minWidth);
      setLoading(false);
    });
  }, [actual, expect]);

  useEffect(() => {
    if (loading) return;
    const sliderRect = sliderRef.current?.getBoundingClientRect();
    const sliderWidth = sliderRect?.width ?? width;
    if (sliderWidth < width) setWidth(sliderWidth);
  }, [loading, width]);

  const handleSlide = (event: React.ChangeEvent<HTMLInputElement>): void => setValue(event.target.value);

  return (
    <div
      css={css`
        position: relative;
        margin: 20px;
      `}
      style={{ height: `${height}px` }}
    >
      {loading ? (
        <Loader active type="big" />
      ) : (
        <>
          <input
            ref={sliderRef}
            type="range"
            css={css`
              position: absolute;
              cursor: ew-resize;
              background: none;
              outline: none;
              height: 100%;
              width: 100%;
              top: 0;
              left: 0;
              margin: 0;
              z-index: 1;
              appearance: none;

              &::-moz-range-thumb {
                border: none;
                background: none;
                box-shadow: 0 0 0 0.5px #888;
                height: ${height}px;
                width: 0px;
                appearance: none;
              }
              &::-webkit-slider-thumb {
                border: none;
                background: none;
                box-shadow: 0 0 0 0.5px #888;
                height: ${height}px;
                width: 0px;
                appearance: none;
              }
              &::-ms-thumb {
                border: none;
                background: none;
                box-shadow: 0 0 0 0.5px #888;
                height: ${height}px;
                width: 0px;
                appearance: none;
              }
            `}
            min="0"
            max={width}
            defaultValue={value}
            onChange={handleSlide}
          />
          <div
            css={css`
              overflow: hidden;
              position: absolute;
              background: #eee;
              height: 100%;
            `}
            style={{ width: `${value}px` }}
          >
            <img
              alt="expect"
              src={expect}
              css={css`
                box-shadow: 0 0 0 1px #419d14;
                vertical-align: top;
                background: #fff;
              `}
              style={{ width: `${width}px` }}
            />
          </div>
          <img
            alt="actual"
            src={actual}
            css={css`
              box-shadow: 0 0 0 1px #d9472b;
              vertical-align: top;
              max-width: 100%;
            `}
            style={{ width: `${width}px` }}
          />
        </>
      )}
    </div>
  );
}
