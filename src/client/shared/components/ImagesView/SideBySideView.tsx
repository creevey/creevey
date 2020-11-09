import React from 'react';
import { ViewPropsWithTheme, getBorderColor, themeBorderColors } from './ImagesView';
import { styled, withTheme } from '@storybook/theming';

const Container = styled.div({
  display: 'flex',
  flexWrap: 'nowrap',
  justifyContent: 'space-evenly',
  alignItems: 'center',
  height: '100%',
  margin: '20px 0',
});

const ImageContainer = styled.a({
  margin: '0 10px',
});

const Image = styled.img<{ borderColor: string }>(({ borderColor }) => ({
  border: `1px solid ${borderColor}`,
  maxWidth: '100%',
}));

export const SideBySideView = withTheme(
  ({ actual, diff, expect, theme }: ViewPropsWithTheme): JSX.Element => {
    return (
      <Container>
        {
          // TODO move to styles after fix https://github.com/storybookjs/storybook/issues/6998
        }
        <ImageContainer href={expect} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '20px' }}>
          <Image borderColor={getBorderColor(theme, themeBorderColors.expect)} alt="expect" src={expect} />
        </ImageContainer>
        <ImageContainer href={diff} target="_blank" rel="noopener noreferrer">
          <Image borderColor={getBorderColor(theme, themeBorderColors.diff)} alt="diff" src={diff} />
        </ImageContainer>
        {
          // TODO move to styles after fix https://github.com/storybookjs/storybook/issues/6998
        }
        <ImageContainer href={actual} target="_blank" rel="noopener noreferrer" style={{ marginRight: '20px' }}>
          <Image borderColor={getBorderColor(theme, themeBorderColors.actual)} alt="actual" src={actual} />
        </ImageContainer>
      </Container>
    );
  },
);
