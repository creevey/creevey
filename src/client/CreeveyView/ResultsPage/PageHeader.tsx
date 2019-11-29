import React from 'react';
import { css } from '@emotion/core';
import Button from '@skbkontur/react-ui/Button';
import Tabs from '@skbkontur/react-ui/Tabs';
import { ViewMode } from '../ImagesView/ImagesView';

const modes: ViewMode[] = ['side-by-side', 'swap', 'slide', 'blend'];

interface PageHeaderProps {
  imageNames: string[];
  imageName: string;
  showViewModes: boolean;
  viewMode: ViewMode;
  onImageChange: (imageName: string) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
}

export function PageHeader({
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
    <>
      <div
        css={css`
          padding: 5px 20px;
        `}
      >
        {images.map(name => (
          <Button key={name} use="link" onClick={() => onImageChange(name)} disabled={name === currentImage}>
            {name}
          </Button>
        ))}
      </div>
      {showViewModes && (
        <Tabs value={viewMode} onChange={handleViewModeChange}>
          {modes.map(mode => (
            <Tabs.Tab key={mode} id={mode}>
              {mode}
            </Tabs.Tab>
          ))}
        </Tabs>
      )}
    </>
  );
}
