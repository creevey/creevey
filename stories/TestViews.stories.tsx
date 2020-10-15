import React, { FunctionComponent } from 'react';
import { styled } from '@storybook/theming';

export default {
  title: 'TestViews',
  parameters: { creevey: { captureElement: '[data-tid="CaptureElement"]' } },
};

const CHUNK_SIZE = 250;
const DIAG_LENGTH = (2 * CHUNK_SIZE ** 2) ** (1 / 2);

const ChunkContainer = styled.div({
  backgroundColor: '#a5d6a7',
  backgroundImage: `linear-gradient(
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
    )`,
  width: `${CHUNK_SIZE}px`,
  height: `${CHUNK_SIZE}px`,
  boxShadow: '0 0 0 1px #85b687',
  textAlign: 'center',
  border: 'inset 10px solid rgba(0, 0, 0, 0.1)',
});

const Wrapper = styled.span({
  lineHeight: `${CHUNK_SIZE}px`,
  color: '#457647',
  fontSize: '64px',
});

const ComponentChunk: FunctionComponent = (props) => (
  <ChunkContainer>
    <Wrapper>{props.children}</Wrapper>
  </ChunkContainer>
);

const ChunkTilesContainer = styled.div<{ offset: number; size: number }>(({ offset, size }) => ({
  margin: `${offset * CHUNK_SIZE}px`,
  width: `${size * CHUNK_SIZE}px`,
  display: 'flex',
  flexWrap: 'wrap',
}));

const ChunkTiles: FunctionComponent<{ size: number; offset: number }> = (props) => (
  <ChunkTilesContainer data-tid="CaptureElement" offset={props.offset} size={props.size}>
    {Array.from({ length: props.size ** 2 }).map((_, index) => (
      <ComponentChunk key={index}>{index}</ComponentChunk>
    ))}
  </ChunkTilesContainer>
);

export const ViewportFit = (): JSX.Element => <ChunkTiles size={2} offset={0} />;
export const Overflow = (): JSX.Element => <ChunkTiles size={6} offset={0} />;
export const ViewportFitOffset = (): JSX.Element => <ChunkTiles size={2} offset={4} />;
export const OverflowOffset = (): JSX.Element => <ChunkTiles size={6} offset={4} />;
