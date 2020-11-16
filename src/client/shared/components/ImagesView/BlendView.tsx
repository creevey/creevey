import React from 'react';
import { ViewPropsWithTheme, getBorderColor, themeBorderColors } from './ImagesView';
import { styled, withTheme } from '@storybook/theming';

const Container = styled.div({
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  filter: 'invert(100%)',
});

const ImageContainer = styled.div({
  position: 'absolute',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
});

const Image = styled.img<{ borderColor: string }>(({ borderColor }) => ({
  border: `1px solid ${borderColor}`,
  maxWidth: '100%',
  filter: 'invert(100%)',
}));

const DiffImage = styled.img({
  maxWidth: '100%',
  opacity: '0',
  border: '1px solid transparent',
});

export const BlendView = withTheme(
  ({ actual, diff, expect, theme }: ViewPropsWithTheme): JSX.Element => {
    return (
      <Container>
        <ImageContainer>
          <Image borderColor={getBorderColor(theme, themeBorderColors.expect)} alt="actual" src={actual} />
        </ImageContainer>
        <ImageContainer>
          <Image
            borderColor={getBorderColor(theme, themeBorderColors.actual)}
            style={{ mixBlendMode: 'difference' }}
            alt="expect"
            src={expect}
          />
        </ImageContainer>
        <DiffImage alt="diff" src={diff} />
      </Container>
    );
  },
);
