import React, { useEffect, useRef } from 'react';
import { ViewPropsWithTheme, getBorderColor, themeBorderColors } from './ImagesView.js';
import { styled, withTheme } from '@storybook/theming';
import { useApplyScale, useCalcScale, useLoadImages } from '../../helpers.js';
import { readyForCapture } from '../../../addon/readyForCapture.js';

const Container = styled.div({
  position: 'relative',
  display: 'flex',
  filter: 'invert(100%)',
});

const ImageContainer = styled.div({
  position: 'absolute',
  width: '100%',
  height: '100%',
  display: 'flex',
});

const Image = styled.img<{ borderColor: string }>(({ borderColor }) => ({
  boxSizing: 'border-box',
  border: `1px solid ${borderColor}`,
  maxWidth: '100%',
  filter: 'invert(100%)',
}));

const ActualImage = styled(Image)({
  mixBlendMode: 'difference',
});

const DiffImage = styled(Image)({
  opacity: '0',
});

export const BlendView = withTheme(({ actual, diff, expect, theme }: ViewPropsWithTheme): JSX.Element => {
  const expectImageRef = useRef<HTMLImageElement | null>(null);
  const diffImageRef = useRef<HTMLImageElement | null>(null);
  const actualImageRef = useRef<HTMLImageElement | null>(null);

  const loaded = useLoadImages(expect, diff, actual);
  const scale = useCalcScale(diffImageRef, loaded);

  useApplyScale(expectImageRef, scale, loaded);
  useApplyScale(actualImageRef, scale, loaded);

  useEffect(() => {
    if (loaded) readyForCapture();
  }, [loaded]);

  return (
    <Container>
      <ImageContainer>
        <Image
          ref={expectImageRef}
          borderColor={getBorderColor(theme, themeBorderColors.expect)}
          alt="expect"
          src={expect}
        />
      </ImageContainer>
      <DiffImage ref={diffImageRef} borderColor={'transparent'} alt="diff" src={diff} />
      <ImageContainer>
        <ActualImage
          ref={actualImageRef}
          borderColor={getBorderColor(theme, themeBorderColors.actual)}
          alt="actual"
          src={actual}
        />
      </ImageContainer>
    </Container>
  );
});
