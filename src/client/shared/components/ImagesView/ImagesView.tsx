import React, { FunctionComponent } from 'react';
import { SideBySideView } from './SideBySideView';
import { SwapView } from './SwapView';
import { SlideView } from './SlideView';
import { BlendView } from './BlendView';
import { Images, ImagesViewMode } from '../../../../types';
import { Color, styled, Theme, withTheme } from '@storybook/theming';

export const themeBorderColors = {
  actual: 'negative',
  expect: 'positive',
  diff: 'secondary',
};

const isColor = (theme: Theme, color: string): color is keyof Color => color in theme.color;
export function getBorderColor(theme: Theme, color: string): string {
  return isColor(theme, color) ? theme.color[color] : color;
}

interface ViewProps {
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

const Container = withTheme(
  styled.div(({ theme }) => ({
    background: theme.color.mediumlight,
    height: '100%',
    display: 'flex',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  })),
);

const ActualImage = withTheme(
  styled.img(({ theme }) => {
    return {
      border: `1px solid ${getBorderColor(theme, themeBorderColors.expect)}`,
      maxWidth: '100%',
    };
  }),
);

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
