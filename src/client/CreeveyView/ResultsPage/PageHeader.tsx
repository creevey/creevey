import React from 'react';
import { css } from '@emotion/core';
import DeleteIcon from '@skbkontur/react-icons/Delete';
import Tabs from '@skbkontur/react-ui/Tabs';
import { ViewMode } from '../ImagesView/ImagesView';
import { TestResult } from '../../../types';
import { ImageSwap } from './ImageSwap';

const modes: ViewMode[] = ['side-by-side', 'swap', 'slide', 'blend'];

interface PageHeaderProps {
  url: string;
  result: TestResult;
  title: string[];
  errorMessage?: string;
  imageNames: string[];
  imageName: string;
  showViewModes: boolean;
  viewMode: ViewMode;
  onImageChange: (imageName: string) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
}

export function PageHeader({
  url,
  result,
  title,
  errorMessage,
  imageNames: images,
  imageName: currentImage,
  showViewModes,
  viewMode,
  onImageChange,
  onViewModeChange,
}: PageHeaderProps): JSX.Element {
  const handleViewModeChange = (_: { target: { value: string } }, mode: string): void =>
    onViewModeChange(mode as ViewMode);

  return (
    <div
      css={css`
        margin: 24px 44px 0;
      `}
    >
      <h1
        css={css`
          font-weight: 600;
          margin: 0;
        `}
      >
        {title
          .flatMap(token => [
            token,
            <span
              key={token}
              css={css`
                padding: 0 8px;
                color: #a0a0a0;
              `}
            >
              /
            </span>,
          ])
          .slice(0, -1)}
      </h1>
      {errorMessage && (
        <div
          css={css`
            margin-top: 8px;
            padding: 8px;
            background: #ffd6d6;
            color: #ce0014;
            border-radius: 2px;
            display: flex;
          `}
        >
          <DeleteIcon />
          <pre
            css={css`
              margin: 0 4px;
              line-height: 22px;
            `}
          >
            {errorMessage}
          </pre>
        </div>
      )}
      {images.length > 1 ? (
        <div
          css={css`
            display: flex;
            margin-top: 32px;
          `}
        >
          {images.map(name => (
            <ImageSwap
              key={name}
              url={url}
              isActual={name === currentImage}
              onClick={() => onImageChange(name)}
              imageName={result.images?.[name]?.actual}
            />
          ))}
        </div>
      ) : null}
      {showViewModes ? (
        <Tabs value={viewMode} onChange={handleViewModeChange}>
          {modes.map(mode => (
            <Tabs.Tab key={mode} id={mode}>
              {mode}
            </Tabs.Tab>
          ))}
        </Tabs>
      ) : (
        <div
          css={css`
            margin-top: 48px;
          `}
        />
      )}
    </div>
  );
}
