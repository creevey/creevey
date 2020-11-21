import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ViewPropsWithTheme, getBorderColor, themeBorderColors } from './ImagesView';
import { styled, withTheme } from '@storybook/theming';
import { isDefined } from '../../../../types';
import { useLoadImages, useResizeObserver } from '../../helpers';
import { Loader } from '@storybook/components';

type LayoutDirection = 'horizontal' | 'vertical';

const Container = styled.div({
  display: 'flex',
  flexWrap: 'nowrap',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  width: '100%',
});

const ImagesLayout = styled.div<{ layout: LayoutDirection }>(({ layout }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
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
  border: `1px solid ${borderColor}`,
  boxSizing: 'content-box',
  maxWidth: '100%',
  flexShrink: 0,
}));

const DiffImage = styled.img<{ borderColor: string }>(({ borderColor }) => ({
  border: `1px solid ${borderColor}`,
  boxSizing: 'content-box',
  maxWidth: '100%',
}));

export const SideBySideView = withTheme(
  ({ actual, diff, expect, theme }: ViewPropsWithTheme): JSX.Element => {
    const [layout, setLayout] = useState<LayoutDirection>('horizontal');
    const [scale, setScale] = useState(1);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const expectImageRef = useRef<HTMLImageElement | null>(null);
    const diffImageRef = useRef<HTMLImageElement | null>(null);
    const actualImageRef = useRef<HTMLImageElement | null>(null);

    const sources = useMemo(() => [expect, diff, actual], [expect, diff, actual]);
    const loaded = useLoadImages(sources);

    const calcScale = useCallback(() => {
      const containerElement = containerRef.current;
      const expectImage = expectImageRef.current;
      const diffImage = diffImageRef.current;
      const actualImage = actualImageRef.current;

      if (!containerElement || !expectImage || !actualImage || !diffImage || !loaded) return;
      if (layout == 'vertical') {
        setScale((diffImage.getBoundingClientRect().width - 2) / diffImage.naturalWidth);
      }
      if (layout == 'horizontal') {
        const ratio =
          // NOTE: 44px because we have two margins by 20px and 1px border for each image
          (containerElement.clientWidth - 44) /
          [expectImage, diffImage, actualImage].map((image) => image.naturalWidth).reduce((a, b) => a + b, 0);
        setScale(Math.min(1, ratio));
      }
    }, [loaded, layout]);

    useResizeObserver(containerRef, calcScale);

    useLayoutEffect(calcScale, [calcScale]);

    useLayoutEffect(() => {
      const diffImage = diffImageRef.current;
      if (!diffImage || !loaded) return;
      const ratio = diffImage.naturalWidth / diffImage.naturalHeight;
      setLayout(ratio >= 2 ? 'vertical' : 'horizontal');
    }, [loaded]);

    useLayoutEffect(() => {
      if (!loaded) return;
      [expectImageRef, actualImageRef]
        .map((x) => x.current)
        .filter(isDefined)
        .forEach((image) => (image.style.height = `${image.naturalHeight * scale}px`));
    }, [loaded, scale]);

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
  },
);
