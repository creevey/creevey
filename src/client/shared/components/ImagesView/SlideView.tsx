import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { styled, withTheme } from '@storybook/theming';
import { getBorderColor, themeBorderColors, ViewPropsWithTheme } from './ImagesView';
import { useApplyScale, useCalcScale, useLoadImages } from '../../helpers';
import { Loader } from '@storybook/components';

const Container = styled.div({
  position: 'relative',
  display: 'flex',
});

const Input = styled.input({
  position: 'absolute',
  cursor: 'ew-resize',
  appearance: 'none',
  background: 'none',
  boxShadow: 'none',
  outline: 'none',
  height: '100%',
  width: '100%',
  margin: '0',
  zIndex: 1,

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

const ImageWrapper = withTheme(
  styled.div(({ theme }) => ({
    background: theme.base == 'light' ? theme.color.mediumlight : theme.color.darker,
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
  })),
);

const BaseImage = styled.img<{ borderColor: string }>(({ borderColor }) => ({
  boxSizing: 'border-box',
  border: `1px solid ${borderColor}`,
  maxWidth: '100%',
}));

const Image = styled(BaseImage)({
  position: 'absolute',
});

const DiffImage = styled(BaseImage)({
  opacity: '0',
});

export const SlideView = withTheme(
  ({ actual, diff, expect, theme }: ViewPropsWithTheme): JSX.Element => {
    const [step, setStep] = useState(0);

    const expectedImageContainerRef = useRef<HTMLDivElement | null>(null);
    const expectedImageWrapperRef = useRef<HTMLDivElement | null>(null);

    const expectImageRef = useRef<HTMLImageElement | null>(null);
    const diffImageRef = useRef<HTMLImageElement | null>(null);
    const actualImageRef = useRef<HTMLImageElement | null>(null);

    const loaded = useLoadImages(expect, diff, actual);
    const scale = useCalcScale(diffImageRef, loaded);

    useApplyScale(expectImageRef, scale);
    useApplyScale(actualImageRef, scale);

    const handleSlide = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
      if (!expectedImageContainerRef.current || !expectedImageWrapperRef.current) return;
      const offset = Number(event.target.value);
      expectedImageContainerRef.current.style.right = `${100 - offset}%`;
      expectedImageWrapperRef.current.style.left = `${100 - offset}%`;
    }, []);

    useLayoutEffect(() => {
      if (loaded && diffImageRef.current) setStep(100 / diffImageRef.current.getBoundingClientRect().width);
    }, [loaded, scale]);

    useLayoutEffect(() => {
      if (loaded && expectedImageContainerRef.current && expectedImageWrapperRef.current) {
        expectedImageContainerRef.current.style.right = '100%';
        expectedImageWrapperRef.current.style.left = '100%';
      }
    }, [loaded]);

    return loaded ? (
      <Container>
        <Input type="range" min={0} max={100} defaultValue={0} step={step} onChange={handleSlide} />
        <ImageContainer>
          <ImageWrapper>
            <Image
              ref={actualImageRef}
              borderColor={getBorderColor(theme, themeBorderColors.actual)}
              alt="actual"
              src={actual}
            />
          </ImageWrapper>
        </ImageContainer>
        <ImageContainer ref={expectedImageContainerRef}>
          <ImageWrapper ref={expectedImageWrapperRef}>
            <Image
              ref={expectImageRef}
              borderColor={getBorderColor(theme, themeBorderColors.expect)}
              alt="expect"
              src={expect}
            />
          </ImageWrapper>
        </ImageContainer>
        <DiffImage ref={diffImageRef} borderColor={'transparent'} alt="diff" src={diff} />
      </Container>
    ) : (
      <Loader size={64} />
    );
  },
);
