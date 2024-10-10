import React, { FunctionComponent } from 'react';
import { styled } from '@storybook/theming';
import { Meta, StoryObj } from '@storybook/react';

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
  <ChunkContainer data-testid="Tile">
    <Wrapper data-testid="TileContent">{props.children}</Wrapper>
  </ChunkContainer>
);

const ChunkTilesContainer = styled.div<{ offset: number; size: number }>(({ offset, size }) => ({
  margin: `${offset * CHUNK_SIZE}px`,
  width: `${size * CHUNK_SIZE}px`,
  display: 'flex',
  flexWrap: 'wrap',
}));

const ChunkTiles: FunctionComponent<{ size: number; offset: number }> = (props) => (
  <ChunkTilesContainer data-testid="CaptureElement" offset={props.offset} size={props.size}>
    {Array.from({ length: props.size ** 2 }).map((_, index) => (
      <ComponentChunk key={index}>{index}</ComponentChunk>
    ))}
  </ChunkTilesContainer>
);

const Kind: Meta<typeof ChunkTiles> = {
  title: 'TestViews',
  component: ChunkTiles,
  parameters: { creevey: { captureElement: '[data-testid="CaptureElement"]' } },
};

export default Kind;

export const ViewportFit: StoryObj<typeof ChunkTiles> = { args: { size: 2, offset: 0 } };
export const Overflow: StoryObj<typeof ChunkTiles> = { args: { size: 6, offset: 0 } };
export const ViewportFitOffset: StoryObj<typeof ChunkTiles> = { args: { size: 2, offset: 4 } };
export const OverflowOffset: StoryObj<typeof ChunkTiles> = { args: { size: 6, offset: 4 } };
export const IgnoreElements: StoryObj<typeof ChunkTiles> = {
  args: { size: 3, offset: 0 },
  parameters: {
    creevey: {
      ignoreElements: '[data-testid=Tile]:nth-of-type(even) [data-testid=TileContent]',
    },
  },
};
