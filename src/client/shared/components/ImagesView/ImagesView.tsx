import React, { JSX, FunctionComponent } from 'react';
import { styled, withTheme } from '@storybook/theming';
import { SideBySideView } from './SideBySideView.js';
import { SwapView } from './SwapView.js';
import { SlideView } from './SlideView.js';
import { BlendView } from './BlendView.js';
import { Images, ImagesViewMode } from '../../../../types.js';
import { getBorderColor, themeBorderColors, ViewProps } from './common.js';

interface ImagesViewProps {
  url?: string;
  image: Images;
  canApprove: boolean;
  mode: ImagesViewMode;
}

const views: Record<ImagesViewMode, FunctionComponent<ViewProps>> = {
  'side-by-side': SideBySideView,
  swap: SwapView,
  slide: SlideView,
  blend: BlendView,
};

const Container = styled.div({
  height: '100%',
  display: 'flex',
  textAlign: 'center',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 20px',
});

const ImageLink = styled.a({
  lineHeight: 0,
});

const ActualImage = withTheme(
  styled.img(({ theme }) => {
    return {
      border: `1px solid ${getBorderColor(theme, themeBorderColors.expect)}`,
      maxWidth: '100%',
    };
  }),
);

function normalizeUrl(image: string, url?: string): string {
  return url ? `${url}/${image}` : image;
}

export function ImagesView({ url, image, canApprove, mode }: ImagesViewProps): JSX.Element {
  const ViewComponent = views[mode];

  const { actual, diff, expect } = image;

  return (
    <Container>
      {canApprove && diff && expect ? (
        <ViewComponent
          actual={normalizeUrl(actual, url)}
          diff={normalizeUrl(diff, url)}
          expect={normalizeUrl(expect, url)}
        />
      ) : (
        <ImageLink href={normalizeUrl(actual, url)} target="_blank" rel="noopener noreferrer">
          <ActualImage alt="actual" src={normalizeUrl(actual, url)} />
        </ImageLink>
      )}
    </Container>
  );
}
