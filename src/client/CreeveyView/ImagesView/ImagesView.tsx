import React, { FunctionComponent } from 'react';
import { css } from '@emotion/core';
import { SideBySideView } from './SideBySideView';
import { SwapView } from './SwapView';
import { SlideView } from './SlideView';
import { BlendView } from './BlendView';
import { Images } from '../../../types';

export interface ViewProps {
  actual: string;
  diff: string;
  expect: string;
}

export type ViewMode = 'side-by-side' | 'swap' | 'slide' | 'blend';

interface ImagesViewProps {
  url: string;
  image: Images;
  canApprove: boolean;
  mode: ViewMode;
}

const views: { [mode in ViewMode]: FunctionComponent<ViewProps> } = {
  'side-by-side': SideBySideView,
  swap: SwapView,
  slide: SlideView,
  blend: BlendView,
};

export function ImagesView({ url, image, canApprove, mode }: ImagesViewProps): JSX.Element {
  const ViewComponent = views[mode];

  const { actual, diff, expect } = image;

  return (
    <div
      css={css`
        background: #eee;
        height: 100%;
        display: flex;
        text-align: center;
        align-items: center;
        justify-content: center;
      `}
    >
      {canApprove && diff && expect ? (
        <ViewComponent actual={`${url}/${actual}`} diff={`${url}/${diff}`} expect={`${url}/${expect}`} />
      ) : (
        <a
          css={css`
            margin: 20px;
          `}
          href={`${url}/${actual}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            alt="actual"
            src={`${url}/${actual}`}
            css={css`
              border: 1px solid #419d14;
              max-width: 100%;
            `}
          />
        </a>
      )}
    </div>
  );
}
