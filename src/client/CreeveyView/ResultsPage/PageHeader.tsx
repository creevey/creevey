import React from 'react';
import { css } from '@emotion/core';
import DeleteIcon from '@skbkontur/react-icons/Delete';
import Button from '@skbkontur/react-ui/Button';
import Tabs from '@skbkontur/react-ui/Tabs';
import { ViewMode } from '../ImagesView/ImagesView';

const modes: ViewMode[] = ['side-by-side', 'swap', 'slide', 'blend'];

interface PageHeaderProps {
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
            margin-top: 32px;
            padding: 5px 20px;
          `}
        >
          {images.map(name => (
            <Button key={name} use="link" onClick={() => onImageChange(name)} disabled={name === currentImage}>
              {name}
            </Button>
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
