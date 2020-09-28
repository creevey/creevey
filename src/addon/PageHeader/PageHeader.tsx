import React, { useState } from 'react';
import { ImagesViewMode, Images } from '../../types';
import { getImageUrl } from '../../utils/helpers';
import { Icons, Tabs } from '@storybook/components';
import { styled, withTheme, Theme } from '@storybook/theming';
import { ImagePreview } from './ImagePreview';
import { viewModes } from '../../utils/viewMode';

interface PageHeaderProps {
  title: string[];
  images?: Partial<{
    [name: string]: Images;
  }>;
  errorMessage?: string | null;
  showViewModes: boolean;
  showTitle?: boolean;
  viewMode: ImagesViewMode;
  imagesWithError?: string[];
  theme: Theme;
  onImageChange: (name: string) => void;
  onViewModeChange: (viewMode: ImagesViewMode) => void;
}

const ErrorContainer = styled.div<{ background: string; color: string }>(({ background, color }) => ({
  padding: '8px',
  background: background,
  color: color,
  borderRadius: '2px',
  display: 'flex',

  '& svg': {
    marginRight: 10,
    width: 16,
    height: 16,
  },

  '& pre': {
    margin: '0 4px',
    padding: 0,
    lineHeight: '19px',
  },
}));

const HeaderDivider = styled.span<{ color?: string }>(({ color }) => ({
  padding: '0 8px',
  color: color,
}));

const ImagesEntriesContainer = styled.div({
  display: 'flex',
  margin: '32px 0',
});

export function PageHeaderInternal({
  title,
  images = {},
  errorMessage,
  showViewModes,
  showTitle,
  viewMode,
  imagesWithError = [],
  theme,
  onImageChange,
  onViewModeChange,
}: PageHeaderProps): JSX.Element {
  const imageEntires = Object.entries(images) as [string, Images][];
  const [imageName, setImageName] = useState((imageEntires[0] ?? [])[0] ?? '');

  const handleImageChange = (name: string): void => (setImageName(name), onImageChange(name));
  const handleViewModeChange = (mode: string): void => onViewModeChange(mode as ImagesViewMode);
  const error = imagesWithError.includes(imageName) ? images[imageName]?.error || errorMessage : null;

  return (
    <>
      {showTitle && (
        <h1>
          {title
            .flatMap((token) => [
              token,
              <HeaderDivider key={token} color={theme.color.mediumdark}>
                /
              </HeaderDivider>,
            ])
            .slice(0, -1)}
        </h1>
      )}
      {error && (
        <ErrorContainer background={theme.background.negative} color={theme.color.negative}>
          <Icons icon="cross" />
          <pre>{error}</pre>
        </ErrorContainer>
      )}
      {imageEntires.length > 1 ? (
        <ImagesEntriesContainer>
          {imageEntires.map(([name, image]: [string, Images]) => (
            <ImagePreview
              key={name}
              imageName={name}
              url={`${getImageUrl([...title].reverse(), name)}/${image.actual}`}
              isActive={name === imageName}
              onClick={handleImageChange}
              error={imagesWithError.includes(name)}
            />
          ))}
        </ImagesEntriesContainer>
      ) : null}
      {showViewModes && (
        <Tabs selected={viewMode} actions={{ onSelect: handleViewModeChange }}>
          {viewModes.map((x) => (
            <div key={x} id={x} title={x} />
          ))}
        </Tabs>
      )}
    </>
  );
}

export const PageHeader = withTheme(PageHeaderInternal);
