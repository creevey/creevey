import React, { useContext, useState } from 'react';
import { css } from '@emotion/core';
import ScrollContainer from '@skbkontur/react-ui/ScrollContainer';
import { CreeveyContex } from '../../CreeveyContext';
import { ImagesView } from '../ImagesView';
import { PageHeader } from './PageHeader';
import { ViewMode } from '../ImagesView/ImagesView';
import { TestResult } from '../../../types';
import { PageFooter } from './PageFooter';

interface TestResultsProps {
  id: string;
  path: string[];
  results?: TestResult[];
  approved?: Partial<{ [image: string]: number }>;
}

// TODO should better handle offline mode
export function ResultsPage({ id, path, results = [], approved = {} }: TestResultsProps): JSX.Element {
  const imageNames = Object.keys(results[results.length - 1]?.images ?? {});
  const initialImageName = imageNames[0];

  const { onImageApprove } = useContext(CreeveyContex);
  const [retry, setRetry] = useState(results.length);
  const [imageName, setImageName] = useState(initialImageName);
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');

  // path => [kind, story, test, browser]
  const browser = path.slice(-1)[0];
  const result = results[retry - 1];
  const image = result?.images?.[imageName];
  const isApproved = approved[imageName] == retry - 1 || (result && result.status == 'success');
  const imagesUrl = window.location.host ? `/report/${path.slice(0, -1).join('/')}` : path.slice(0, -1).join('/');
  const url = encodeURI(imageName == browser ? imagesUrl : `${imagesUrl}/${browser}`);
  const hasDiffAndExpect = Boolean(image?.diff && image.expect);

  const handleApprove = (): void => onImageApprove(id, retry - 1, imageName);

  return (
    <div
      css={css`
        width: 100%;
        height: 100vh;
      `}
    >
      <PageHeader
        imageName={imageName}
        imageNames={imageNames}
        showViewModes={hasDiffAndExpect}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onImageChange={setImageName}
      />
      <div
        // TODO Styles
        css={css`
          height: calc(100vh - ${hasDiffAndExpect ? 145 : 110}px);
        `}
      >
        {image ? (
          <ScrollContainer>
            <ImagesView
              imageName={imageName}
              url={url}
              actual={image.actual}
              diff={image.diff}
              expect={image.expect}
              approved={isApproved}
              mode={viewMode}
            />
          </ScrollContainer>
        ) : (
          `Image ${imageName} not found`
        )}
      </div>
      <PageFooter
        isApproved={isApproved}
        currentRetry={retry}
        retriesCount={results.length}
        onRetryChange={setRetry}
        onApprove={handleApprove}
      />
    </div>
  );
}
