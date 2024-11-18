import React, { JSX, useEffect, useMemo, useRef, useState } from 'react';
import { styled, withTheme } from '@storybook/theming';
import { ViewPropsWithTheme, getBorderColor, themeBorderColors } from './common.js';
import { useApplyScale, useCalcScale, useLoadImages } from '../../helpers.js';
import { readyForCapture } from '../../../addon/readyForCapture.js';

const Container = styled.div({
  position: 'relative',
  display: 'flex',
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
  backgroundColor: 'white',
}));

const ActualImage = styled(Image)({
  mixBlendMode: 'difference',
});

const DiffImage = styled(Image)({
  opacity: '0',
});

const Mask = styled.div({
  position: 'absolute',
  height: '100%',
  width: '100%',
  backgroundColor: 'red',
  mixBlendMode: 'lighten',
});

export const DiffView = withTheme(({ actual, diff, expect, theme }: ViewPropsWithTheme): JSX.Element => {
  const [opacity, setOpacity] = useState(0.5);
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

  const { brightness, contrast } = useMemo(() => {
    if (opacity < 0.1 || opacity > 0.9) {
      const value = opacity < 0.1 ? opacity : 1 - opacity;
      const brightness = value * (5 / 0.4);
      const contrast = value * (4 / 0.4) + 1;
      return { brightness, contrast };
    }
    const value = opacity >= 0.5 ? 1 - opacity : opacity;
    const brightness = (value - 0.1) * (250 / 0.4) + 5;
    const contrast = (0.5 - value) * (4 / 0.4) + 1;
    return { brightness, contrast };
  }, [opacity]);

  // TODO Tune brightness and contrast
  // TODO Add toggle highlight (slider with changing two images opacity)
  // TODO Add diff mode (show only changed pixels, before and after)
  return (
    <Container>
      <input
        type="range"
        min="0"
        max="1"
        step="0.005"
        style={{
          top: '-40px',
          position: 'absolute',
          width: '20%',
        }}
        value={opacity}
        onChange={(e) => {
          setOpacity(parseFloat(e.target.value));
        }}
      />
      <Container>
        <Container style={{ filter: `brightness(${brightness}) invert(1) contrast(${contrast}) grayscale(1)` }}>
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
        <Mask />
      </Container>
      <Container
        style={{
          position: 'absolute',
          width: '100%',
          mixBlendMode: opacity < 0.1 || opacity > 0.9 ? 'multiply' : 'luminosity',
        }}
      >
        <ImageContainer>
          <Image
            ref={expectImageRef}
            borderColor={getBorderColor(theme, themeBorderColors.expect)}
            alt="expect"
            src={expect}
            style={{ opacity: 1 - opacity, filter: `brightness(${Math.min(1, Math.max(0, 1 - opacity) - 0.5) + 0.5})` }}
          />
        </ImageContainer>
        <ImageContainer>
          <Image
            ref={actualImageRef}
            borderColor={getBorderColor(theme, themeBorderColors.actual)}
            alt="actual"
            src={actual}
            style={{ opacity, filter: `brightness(${Math.min(1, Math.max(0, opacity) - 0.5) + 0.5})` }}
          />
        </ImageContainer>
      </Container>
      {/* <Wrapper style={{ position: 'absolute', width: '100%', mixBlendMode: 'luminosity' }}>
      <ImageContainer>
        <Image
          ref={expectImageRef}
          borderColor={getBorderColor(theme, themeBorderColors.expect)}
          alt="expect"
          src={expect}
          style={{ opacity: 1 - opacity, filter: `brightness(${Math.min(1, Math.max(0, 1 - opacity) - 0.5) + 0.5})` }}
        />
      </ImageContainer>
      <ImageContainer>
        <Image
          ref={actualImageRef}
          borderColor={getBorderColor(theme, themeBorderColors.actual)}
          alt="actual"
          src={actual}
          style={{ opacity, filter: `brightness(${Math.min(1, Math.max(0, opacity) - 0.5) + 0.5})` }}
        />
      </ImageContainer>
      </Wrapper> */}
    </Container>
  );
});
