import React from 'react';
import { ViewProps, borderColors } from './ImagesView';
import { styled } from '@storybook/theming';

const Container = styled.div({
  margin: '20px',
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

export function BlendView({ actual, diff, expect }: ViewProps): JSX.Element {
  const colors: ViewProps = borderColors;
  return (
    <Container>
      <ImageContainer>
        <Image borderColor={colors.expect} alt="actual" src={actual} />
      </ImageContainer>
      <ImageContainer>
        <Image borderColor={colors.actual} style={{ mixBlendMode: 'difference' }} alt="expect" src={expect} />
      </ImageContainer>
      <DiffImage alt="diff" src={diff} />
    </Container>
  );
}
