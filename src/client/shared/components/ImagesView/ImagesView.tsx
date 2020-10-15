import React, { FunctionComponent } from 'react';
import { SideBySideView } from './SideBySideView';
import { SwapView } from './SwapView';
import { SlideView } from './SlideView';
import { BlendView } from './BlendView';
import { Images, ImagesViewMode } from '../../../../types';
import { styled, Theme } from '@storybook/theming';

export const borderColors: ViewProps = {
  actual: '#d9472b',
  expect: '#419d14',
  diff: '#1d85d0',
};

export interface ViewProps {
  actual: string;
  diff: string;
  expect: string;
}

export interface ViewPropsWithTheme extends ViewProps {
  theme: Theme;
}

interface ImagesViewProps {
  url: string;
  image: Images;
  canApprove: boolean;
  mode: ImagesViewMode;
}

const views: { [mode in ImagesViewMode]: FunctionComponent<ViewProps> } = {
  'side-by-side': SideBySideView,
  swap: SwapView,
  slide: SlideView,
  blend: BlendView,
};

const Container = styled.div({
  background: '#eee',
  height: '100%',
  display: 'flex',
  textAlign: 'center',
  alignItems: 'center',
  justifyContent: 'center',
});

const ActualImage = styled.img({
  border: `1px solid ${borderColors.expect}`,
  maxWidth: '100%',
});

export function ImagesView({ url, image, canApprove, mode }: ImagesViewProps): JSX.Element {
  const ViewComponent = views[mode];

  const { actual, diff, expect } = image;

  return (
    <Container>
      {canApprove && diff && expect ? (
        <ViewComponent actual={`${url}/${actual}`} diff={`${url}/${diff}`} expect={`${url}/${expect}`} />
      ) : (
        <a href={`${url}/${actual}`} target="_blank" rel="noopener noreferrer" style={{ margin: '20px' }}>
          <ActualImage alt="actual" src={`${url}/${actual}`} />
        </a>
      )}
    </Container>
  );
}
