import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ViewPropsWithTheme, getBorderColor, themeBorderColors } from './ImagesView';
import { styled, withTheme } from '@storybook/theming';
import { useApplyScale, useLoadImages, useResizeObserver, getBorderSize } from '../../helpers';
import { Loader } from '@storybook/components';
import { readyForCapture } from '../../../addon/readyForCapture';

type LayoutDirection = 'horizontal' | 'vertical';

const Container = styled.div({
  display: 'flex',
  flexWrap: 'nowrap',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
});

const ImagesLayout = styled.div<{ layout: LayoutDirection }>(({ layout }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  flexDirection: layout == 'horizontal' ? 'row' : 'column',

  '& > :not(:first-of-type)': {
    marginLeft: layout == 'horizontal' ? '20px' : 0,
    marginTop: layout == 'horizontal' ? 0 : '20px',
  },
}));

const ImageLink = styled.a({
  lineHeight: 0,
  flexShrink: 0,
});

const ImageDiffLink = styled.a({
  lineHeight: 0,
});

const Image = styled.img<{ borderColor: string }>(({ borderColor }) => ({
  boxSizing: 'border-box',
  border: `1px solid ${borderColor}`,
  maxWidth: '100%',
  flexShrink: 0,
}));

const DiffImage = styled(Image)({
  flexShrink: 1,
});

export const SideBySideView = withTheme(({ actual, diff, expect, theme }: ViewPropsWithTheme): JSX.Element => {
  const [layout, setLayout] = useState<LayoutDirection>('horizontal');
  const [scale, setScale] = useState(1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const expectImageRef = useRef<HTMLImageElement | null>(null);
  const diffImageRef = useRef<HTMLImageElement | null>(null);
  const actualImageRef = useRef<HTMLImageElement | null>(null);

  const loaded = useLoadImages(expect, diff, actual);

  const calcScale = useCallback(() => {
    const containerElement = containerRef.current;
    const expectImage = expectImageRef.current;
    const diffImage = diffImageRef.current;
    const actualImage = actualImageRef.current;

    if (!containerElement || !expectImage || !actualImage || !diffImage || !loaded) return setScale(1);

    const borderSize = getBorderSize(diffImage);

    if (layout == 'vertical') {
      const ratio = (diffImage.getBoundingClientRect().width - borderSize * 2) / diffImage.naturalWidth;
      setScale(Math.min(1, ratio));
    }
    if (layout == 'horizontal') {
      const ratio =
        // NOTE: 40px because we have two margins by 20px and 6px for borders
        (containerElement.getBoundingClientRect().width - 40 - borderSize * 6) /
        [expectImage, diffImage, actualImage].map((image) => image.naturalWidth).reduce((a, b) => a + b, 0);
      setScale(Math.min(1, ratio));
    }
  }, [loaded, layout]);

  useResizeObserver(containerRef, calcScale);
  useLayoutEffect(calcScale, [calcScale]);
  useLayoutEffect(() => {
    // TODO Check image height and viewport
    const diffImage = diffImageRef.current;
    if (!diffImage || !loaded) return;
    const ratio = diffImage.naturalWidth / diffImage.naturalHeight;
    setLayout(ratio >= 2 ? 'vertical' : 'horizontal');
  }, [loaded]);

  useApplyScale(expectImageRef, scale);
  useApplyScale(actualImageRef, scale);

  useEffect(() => {
    if (loaded) readyForCapture();
  }, [loaded]);

  return (
    <Container ref={containerRef}>
      {loaded ? (
        <ImagesLayout layout={layout}>
          <ImageLink href={expect} target="_blank" rel="noopener noreferrer">
            <Image
              ref={expectImageRef}
              borderColor={getBorderColor(theme, themeBorderColors.expect)}
              alt="expect"
              src={expect}
            />
          </ImageLink>
          <ImageDiffLink href={diff} target="_blank" rel="noopener noreferrer">
            <DiffImage
              ref={diffImageRef}
              borderColor={getBorderColor(theme, themeBorderColors.diff)}
              alt="diff"
              src={diff}
            />
          </ImageDiffLink>
          <ImageLink href={actual} target="_blank" rel="noopener noreferrer">
            <Image
              ref={actualImageRef}
              borderColor={getBorderColor(theme, themeBorderColors.actual)}
              alt="actual"
              src={actual}
            />
          </ImageLink>
        </ImagesLayout>
      ) : (
        <Loader size={64} />
      )}
    </Container>
  );
});
