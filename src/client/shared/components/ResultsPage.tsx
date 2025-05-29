import React, { JSX, useCallback, useContext, useEffect, useState } from 'react';
import { Placeholder, ScrollArea } from 'storybook/internal/components';
import { styled, withTheme, Theme } from 'storybook/theming';
import { ImagesView } from './ImagesView/ImagesView.js';
import { PageHeader } from './PageHeader/PageHeader.js';
import { PageFooter } from './PageFooter/PageFooter.js';
import { getImageUrl } from '../helpers.js';
import { getViewMode, VIEW_MODE_KEY, viewModes } from '../viewMode.js';
import { ImagesViewMode, TestResult } from '../../../types.js';
import { CreeveyContext } from '../../web/CreeveyContext.js';

interface ResultsPageProps {
  path: string[];
  results?: TestResult[];
  approved?: Partial<Record<string, number>> | null;
  showTitle?: boolean;
  theme: Theme;
  height?: string;
  retry: number;
  imageName: string;
  onImageChange: (image: string) => void;
  onRetryChange: (retry: number) => void;
}

const Wrapper = styled.div({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
});

const ImagesViewContainer = styled.div(({ theme }) => ({
  background: theme.base == 'light' ? theme.color.mediumlight : theme.color.darker,
  flexGrow: 1,
  padding: '20px 0',
}));

const HeaderContainer = styled.div({ position: 'sticky', top: 0, zIndex: 1 });

const BodyContainer = styled.div({ flexGrow: 1, minHeight: 0 });

const FooterContainer = styled.div({
  position: 'sticky',
  bottom: 0,
  zIndex: 1,
});

const Container = styled.div<{ height?: string }>(({ height = '100vh' }) => ({
  height,
  width: '100%',
  overflowY: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}));

export function ResultsPageInternal({
  path,
  results = [],
  approved,
  theme,
  height,
  retry,
  imageName,
  onImageChange,
  onRetryChange,
}: ResultsPageProps): JSX.Element {
  const result = results[retry - 1] ?? {};
  const { isReport } = useContext(CreeveyContext);
  const [viewMode, setViewMode] = useState<ImagesViewMode>(getViewMode());
  const url = getImageUrl(path, imageName, isReport);
  const image = result.images?.[imageName];
  const canApprove = Boolean(image && approved?.[imageName] != retry - 1 && result.status != 'success');
  const hasDiffAndExpect = canApprove && Boolean(image?.diff && image.expect);
  const imagesWithError = result.images
    ? Object.keys(result.images).filter(
        (imageName) =>
          result.status != 'success' && approved?.[imageName] != retry - 1 && result.images?.[imageName]?.error != null,
      )
    : [];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!canApprove) return;
      if (e.code === 'Tab') {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (e.shiftKey) setViewMode((mode) => viewModes.at((viewModes.indexOf(mode) - 1) % viewModes.length)!);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        else setViewMode((mode) => viewModes.at((viewModes.indexOf(mode) + 1) % viewModes.length)!);
      }
    },
    [canApprove],
  );

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [handleKeyDown]);

  return (
    <Container height={height}>
      <HeaderContainer>
        <PageHeader
          title={path}
          imageName={imageName}
          images={result.images}
          errorMessage={result.error}
          showViewModes={hasDiffAndExpect}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onImageChange={onImageChange}
          imagesWithError={imagesWithError}
        />
      </HeaderContainer>
      <BodyContainer>
        <ScrollArea vertical>
          <Wrapper>
            <ImagesViewContainer theme={theme}>
              {image ? (
                <ImagesView url={url} image={image} canApprove={canApprove} mode={viewMode} />
              ) : (
                <Placeholder>{`Image ${imageName} not found`}</Placeholder>
              )}
            </ImagesViewContainer>
          </Wrapper>
        </ScrollArea>
      </BodyContainer>
      {results.length ? (
        <FooterContainer>
          <PageFooter retry={retry} retriesCount={results.length} onRetryChange={onRetryChange} />
        </FooterContainer>
      ) : null}
    </Container>
  );
}

export const ResultsPage = withTheme(ResultsPageInternal);
