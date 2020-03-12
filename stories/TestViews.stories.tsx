import React, { FunctionComponent } from 'react';
import { css } from '@emotion/core';

export default {
  title: 'TestViews',
  parameters: { creevey: { captureElement: '[data-tid="CaptureElement"]' } },
};

const CHUNK_SIZE = 250;
const DIAG_LENGTH = (2 * CHUNK_SIZE ** 2) ** (1 / 2);

const ComponentChunk: FunctionComponent = props => (
  <div
    css={css`
      background-color: #a5d6a7;
      background-image: linear-gradient(
          45deg,
          rgba(0, 0, 0, 0) ${DIAG_LENGTH / 2 - 0.5}px,
          #85b687 ${DIAG_LENGTH / 2 - 0.5}px,
          #85b687 ${DIAG_LENGTH / 2 + 0.5}px,
          rgba(0, 0, 0, 0) ${DIAG_LENGTH / 2 + 0.5}px
        ),
        linear-gradient(
          315deg,
          rgba(0, 0, 0, 0) ${DIAG_LENGTH / 2 + 0.2}px,
          #85b687 ${DIAG_LENGTH / 2 + 0.2}px,
          #85b687 ${DIAG_LENGTH / 2 + 1.2}px,
          rgba(0, 0, 0, 0) ${DIAG_LENGTH / 2 + 1.2}px
        );
      width: ${CHUNK_SIZE}px;
      height: ${CHUNK_SIZE}px;
      box-shadow: 0 0 0 1px #85b687;
      text-align: center;
      border: inset 10px solid rgba(0, 0, 0, 0.1);
    `}
  >
    <span
      css={css`
        line-height: ${CHUNK_SIZE}px;
        color: #457647;
        font-size: 64px;
      `}
    >
      {props.children}
    </span>
  </div>
);

const ChunkTiles: FunctionComponent<{ size: number; offset: number }> = props => (
  <div
    data-tid="CaptureElement"
    css={css`
      margin: ${props.offset * CHUNK_SIZE}px;
      width: ${props.size * CHUNK_SIZE}px;
      display: flex;
      flex-wrap: wrap;
    `}
  >
    {Array.from({ length: props.size ** 2 }).map((_, index) => (
      <ComponentChunk key={index}>{index}</ComponentChunk>
    ))}
  </div>
);

export const ViewportFit = () => <ChunkTiles size={2} offset={0} />;
export const Overflow = () => <ChunkTiles size={6} offset={0} />;
export const ViewportFitOffset = () => <ChunkTiles size={2} offset={4} />;
export const OverflowOffset = () => <ChunkTiles size={6} offset={4} />;
