import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader } from '@storybook/components';
import { styled, withTheme } from '@storybook/theming';
import { ViewPropsWithTheme, getBorderColor, themeBorderColors } from './ImagesView.js';
import { useApplyScale, useCalcScale, useLoadImages } from '../../helpers.js';
import { readyForCapture } from '../../../addon/readyForCapture.js';

type ImageState = keyof typeof themeBorderColors;

const Container = styled.div({
  position: 'relative',
  display: 'flex',
});

const BaseImage = styled.img<{ borderColor: string }>(({ borderColor }) => ({
  boxSizing: 'border-box',
  border: `1px solid ${borderColor}`,
  maxWidth: '100%',
}));

const Image = styled(BaseImage)({
  position: 'absolute',
});

const DiffImage = styled(BaseImage)({
  cursor: 'pointer',
  outline: 'none',
  opacity: 0,
  zIndex: 1,
});

export const SwapView = withTheme(({ theme, expect, actual, diff }: ViewPropsWithTheme): JSX.Element => {
  const [image, setImage] = useState<ImageState>('actual');

  const expectImageRef = useRef<HTMLImageElement | null>(null);
  const diffImageRef = useRef<HTMLImageElement | null>(null);
  const actualImageRef = useRef<HTMLImageElement | null>(null);

  const loaded = useLoadImages(expect, diff, actual);
  const scale = useCalcScale(diffImageRef, loaded);

  useApplyScale(expectImageRef, scale, image);
  useApplyScale(actualImageRef, scale, image);

  const handleChangeView = useCallback(
    (): void => setImage((prevImage) => (prevImage == 'actual' ? 'expect' : 'actual')),
    [],
  );

  useEffect(() => {
    if (loaded) readyForCapture();
  }, [loaded]);

  return loaded ? (
    <Container>
      <Image
        ref={expectImageRef}
        borderColor={getBorderColor(theme, themeBorderColors.expect)}
        alt={'expect'}
        src={expect}
        hidden={image != 'expect'}
      />
      <DiffImage
        ref={diffImageRef}
        borderColor={'transparent'}
        tabIndex={0}
        alt="diff"
        src={diff}
        onClick={handleChangeView}
      />
      <Image
        ref={actualImageRef}
        borderColor={getBorderColor(theme, themeBorderColors.actual)}
        alt={'actual'}
        src={actual}
        hidden={image != 'actual'}
      />
    </Container>
  ) : (
    <Loader size={64} />
  );
});
