import React, { useCallback, useRef, useState } from 'react';
import { ViewPropsWithTheme, getBorderColor, themeBorderColors } from './ImagesView';
import { styled, withTheme } from '@storybook/theming';

type LayoutDirection = 'horizontal' | 'vertical';

const Container = styled.div({
  display: 'flex',
  flexWrap: 'nowrap',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
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
});

const Image = styled.img<{ borderColor: string }>(({ borderColor }) => ({
  border: `1px solid ${borderColor}`,
  maxWidth: '100%',
}));

export const SideBySideView = withTheme(
  ({ actual, diff, expect, theme }: ViewPropsWithTheme): JSX.Element => {
    const [layout, setLayout] = useState<LayoutDirection>('horizontal');
    const diffImageRef = useRef<HTMLImageElement | null>(null);

    const diffLoadHandler = useCallback(() => {
      const imageEl = diffImageRef.current;

      if (!imageEl) return;

      const ratio = imageEl.naturalWidth / imageEl.naturalHeight;
      setLayout(ratio >= 2 ? 'vertical' : 'horizontal');
    }, []);

    return (
      <Container>
        <ImagesLayout layout={layout}>
          <ImageLink href={expect} target="_blank" rel="noopener noreferrer">
            <Image borderColor={getBorderColor(theme, themeBorderColors.expect)} alt="expect" src={expect} />
          </ImageLink>
          <ImageLink href={diff} target="_blank" rel="noopener noreferrer">
            <Image
              ref={diffImageRef}
              onLoad={diffLoadHandler}
              borderColor={getBorderColor(theme, themeBorderColors.diff)}
              alt="diff"
              src={diff}
            />
          </ImageLink>
          <ImageLink href={actual} target="_blank" rel="noopener noreferrer">
            <Image borderColor={getBorderColor(theme, themeBorderColors.actual)} alt="actual" src={actual} />
          </ImageLink>
        </ImagesLayout>
      </Container>
    );
  },
);
