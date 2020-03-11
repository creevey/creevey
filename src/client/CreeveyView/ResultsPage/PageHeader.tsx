import React, { useState } from 'react';
import { css } from '@emotion/core';
import { ThemeContext, Tabs, ThemeFactory } from '@skbkontur/react-ui';
import DeleteIcon from '@skbkontur/react-icons/Delete';
import { Images, ImagesViewMode } from '../../../types';
import { ImagePreview } from './ImagePreview';
import { getImageUrl } from '../../helpers';

const modes: ImagesViewMode[] = ['side-by-side', 'swap', 'slide', 'blend'];

const IMAGE_PREVIEW_THEME = ThemeFactory.create({
  btnCheckedBg: '#fff',
  btnDefaultBgStart: '#fff',
  btnDefaultBgEnd: '#fff',
  btnDefaultBg: '#fff',
  btnDefaultHoverBgStart: '#fff',
  btnDefaultHoverBgEnd: '#fff',
  btnDefaultHoverBg: '#fff',
  btnDefaultActiveBgStart: '#fff',
  btnDefaultActiveBgEnd: '#fff',
  btnDefaultActiveBg: '#fff',
  btnCheckedShadow: '0 0 0 2px #3072C4',
  btnDefaultShadow: '0 0 0 1px #A0A0A0',
  btnDefaultHoverShadow: '0 0 0 1px #cdcdcd',
  btnDefaultActiveShadow: '0 0 0 1px #e1e1e1',
  btnPaddingXSmall: '0px',
  btnPaddingYSmall: '0px',
  controlHeightSmall: '64px',
  btnHeightShift: '0px',
});

interface PageHeaderProps {
  title: string[];
  images?: Partial<{
    [name: string]: Images;
  }>;
  errorMessage?: string;
  showViewModes: boolean;
  onImageChange: (name: string) => void;
  onViewModeChange: (viewMode: ImagesViewMode) => void;
}

export function PageHeader({
  title,
  images = {},
  errorMessage,
  showViewModes,
  onImageChange,
  onViewModeChange,
}: PageHeaderProps): JSX.Element {
  const imageEntires = Object.entries(images) as [string, Images][];
  const [imageName, setImageName] = useState((imageEntires[0] ?? [])[0] ?? '');
  const [viewMode, setViewMode] = useState<ImagesViewMode>('side-by-side');

  const handleImageChange = (name: string): void => (setImageName(name), onImageChange(name));
  const handleViewModeChange = (mode: string): void => (
    setViewMode(mode as ImagesViewMode), onViewModeChange(mode as ImagesViewMode)
  );

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
      {imageEntires.length > 1 ? (
        <div
          css={css`
            display: flex;
            margin-top: 32px;
          `}
        >
          <ThemeContext.Provider value={IMAGE_PREVIEW_THEME}>
            {imageEntires.map(([name, image]: [string, Images]) => (
              <span
                key={name}
                css={css`
                  margin-left: 16px;
                `}
              >
                <ImagePreview
                  imageName={name}
                  url={`${getImageUrl(title, name)}/${image.actual}`}
                  isActive={name === imageName}
                  onClick={handleImageChange}
                />
              </span>
            ))}
          </ThemeContext.Provider>
        </div>
      ) : null}
      {showViewModes ? (
        <Tabs value={viewMode} onValueChange={handleViewModeChange}>
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
