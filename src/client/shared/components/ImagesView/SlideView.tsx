import React, { useState } from 'react';
import { styled, withTheme } from '@storybook/theming';
import { getBorderColor, themeBorderColors, ViewPropsWithTheme } from './ImagesView';

const Container = styled.div({
  position: 'relative',
  margin: '20px',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
});

const Input = styled.input({
  position: 'absolute',
  cursor: 'ew-resize',
  background: 'none',
  boxShadow: 'none',
  outline: 'none',
  height: '100%',
  width: '100%',
  margin: '0',
  zIndex: 1,
  appearance: 'none',

  '&::-webkit-slider-runnable-track': {
    height: '100%',
  },
  '&::-webkit-slider-thumb': {
    boxShadow: '0 0 0 0.5px #888',
    height: '100%',
    width: '0px',
    appearance: 'none',
  },

  '&::-moz-focus-outer': {
    border: '0',
  },
  '&::-moz-range-track': {
    height: '0',
  },
  '&::-moz-range-thumb': {
    border: 'none',
    boxShadow: '0 0 0 0.5px #888',
    height: '100%',
    width: '0px',
  },
});

const ImageContainer = styled.div({
  position: 'absolute',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
});

const ImageWrapper = styled.div({
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
});

const Image = styled.img<{ borderColor: string }>(({ borderColor }) => ({
  border: `1px solid ${borderColor}`,
  maxWidth: '100%',
  background: '#fff',
}));

const DiffImage = styled.img({
  maxWidth: '100%',
  opacity: '0',
  border: '1px solid transparent',
});

export const SlideView = withTheme(
  ({ actual, diff, expect, theme }: ViewPropsWithTheme): JSX.Element => {
    const [step, setStep] = useState(0);
    const [offset, setOffset] = useState(0);

    const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>): void =>
      setStep(100 / (event.currentTarget.width + 2));

    const handleSlide = (event: React.ChangeEvent<HTMLInputElement>): void => setOffset(Number(event.target.value));

    return (
      <Container>
        <Input type="range" min={0} max={100} step={step} defaultValue={offset} onChange={handleSlide} />
        <ImageContainer>
          <ImageWrapper>
            <Image alt="actual" src={actual} borderColor={getBorderColor(theme, themeBorderColors.actual)} />
          </ImageWrapper>
        </ImageContainer>
        <ImageContainer style={{ right: `${100 - offset}%` }}>
          <ImageWrapper style={{ left: `${100 - offset}%` }}>
            <Image alt="expect" src={expect} borderColor={getBorderColor(theme, themeBorderColors.expect)} />
          </ImageWrapper>
        </ImageContainer>
        <DiffImage alt="diff" src={diff} onLoad={handleImageLoad} />
      </Container>
    );
  },
);
