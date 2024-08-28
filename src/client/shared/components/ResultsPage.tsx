import React, { useState, useEffect } from 'react';
import { Placeholder, ScrollArea } from '@storybook/components';
import { styled, withTheme, Theme } from '@storybook/theming';
import { ImagesView } from './ImagesView/ImagesView.js';
import { PageHeader } from './PageHeader/PageHeader.js';
import { PageFooter } from './PageFooter/PageFooter.js';
import { getImageUrl } from '../helpers.js';
import { getViewMode, VIEW_MODE_KEY } from '../viewMode.js';
import { ImagesViewMode, TestResult } from '../../../types.js';

interface TestResultsProps {
  id: string;
  path: string[];
  results?: TestResult[];
  approved?: Partial<{ [image: string]: number }>;
  showTitle?: boolean;
  onImageApprove: (id: string, retry: number, image: string) => void;
  theme: Theme;
  height?: string;
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
  id,
  path,
  results = [],
  approved = {},
  theme,
  onImageApprove,
  showTitle = false,
  height,
}: TestResultsProps): JSX.Element {
  const [retry, setRetry] = useState(results.length);
  const result = results[retry - 1] ?? {};
  const [imageName, setImageName] = useState(Object.keys(result.images ?? {})[0] ?? '');
  const [viewMode, setViewMode] = useState<ImagesViewMode>(getViewMode());

  useEffect(() => setRetry(results.length), [results.length]);

  const url = getImageUrl(path, imageName);
  const image = result.images?.[imageName];
  const canApprove = Boolean(image && approved[imageName] != retry - 1 && result.status != 'success');
  const hasDiffAndExpect = canApprove && Boolean(image?.diff && image.expect);
  const imagesWithError = result.images
    ? Object.keys(result.images).filter(
        (imageName) =>
          result.status != 'success' &&
          approved[imageName] != retry - 1 &&
          (result.images || {})[imageName]?.error != null,
      )
    : [];

  const handleApprove = (): void => onImageApprove(id, retry - 1, imageName);
  const handleChangeViewMode = (mode: ImagesViewMode): void => {
    localStorage.setItem(VIEW_MODE_KEY, mode);
    setViewMode(mode);
  };

  return (
    <Container height={height}>
      <HeaderContainer>
        <PageHeader
          title={path}
          images={result.images}
          errorMessage={result.error}
          showViewModes={hasDiffAndExpect}
          viewMode={viewMode}
          onViewModeChange={handleChangeViewMode}
          onImageChange={setImageName}
          showTitle={showTitle}
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
          <PageFooter
            canApprove={canApprove}
            retry={retry}
            retriesCount={results.length}
            onRetryChange={setRetry}
            onApprove={handleApprove}
          />
        </FooterContainer>
      ) : null}
    </Container>
  );
}

export const ResultsPage = withTheme(ResultsPageInternal);
