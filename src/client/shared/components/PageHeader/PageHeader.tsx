import React, { useEffect } from 'react';
import { Icons, Tabs } from '@storybook/components';
import { styled, withTheme, Theme } from '@storybook/theming';
import { ImagesViewMode, Images } from '../../../../types.js';
import { getImageUrl } from '../../helpers.js';
import { ImagePreview } from './ImagePreview.js';
import { viewModes } from '../../viewMode.js';

interface PageHeaderProps {
  title: string[];
  imageName: string;
  images?: Partial<Record<string, Images>>;
  errorMessage?: string | null;
  showViewModes: boolean;
  viewMode: ImagesViewMode;
  imagesWithError?: string[];
  onImageChange: (name: string) => void;
  onViewModeChange: (viewMode: ImagesViewMode) => void;
}

const Container = styled.div({
  margin: '24px 44px 0',
});

const ErrorContainer = withTheme(
  styled.div<{ theme: Theme }>(({ theme }) => ({
    marginTop: '8px',
    padding: '8px',
    background: theme.background.negative,
    color: theme.color.negative,
    borderRadius: '2px',
    display: 'flex',
    alignItems: 'baseline',

    '& svg': {
      margin: '0 5px',
      width: 8,
      height: 8,
    },

    '& pre': {
      margin: '0 4px',
      padding: 0,
      lineHeight: '22px',
    },
  })),
);

const H1 = styled.h1({
  margin: 0,
  marginBottom: '8px',
});

const HeaderDivider = withTheme(
  styled.span<{ theme: Theme }>(({ theme }) => ({
    padding: '0 8px',
    color: theme.color.mediumdark,
  })),
);

const ImagesEntriesContainer = styled.div({
  display: 'flex',
  margin: '16px 0 8px',
});

// TODO Move images to sidebar
export function PageHeader({
  title,
  imageName,
  images = {},
  errorMessage,
  showViewModes,
  viewMode,
  imagesWithError = [],
  onImageChange,
  onViewModeChange,
}: PageHeaderProps): JSX.Element | null {
  const imageEntires = Object.entries(images) as [string, Images][];

  const handleViewModeChange = (mode: string): void => {
    onViewModeChange(mode as ImagesViewMode);
  };

  useEffect(() => {
    if (imageName === '') {
      if (imagesWithError.length > 0) {
        onImageChange(imagesWithError[0]);
        return;
      }
      const firstImage = Object.keys(images).at(0);
      if (firstImage) onImageChange(firstImage);
    }
  }, [imageName, images, imagesWithError, onImageChange]);

  const error = errorMessage || imagesWithError.includes(imageName) ? (images[imageName]?.error ?? errorMessage) : null;

  return (
    <Container>
      <H1>{title.flatMap((token) => [token, <HeaderDivider key={token}>/</HeaderDivider>]).slice(0, -1)}</H1>
      {error && (
        <ErrorContainer>
          <Icons icon="closeAlt" />
          <pre>{error}</pre>
        </ErrorContainer>
      )}
      {imageEntires.length > 1 ? (
        <ImagesEntriesContainer>
          {imageEntires.map(([name, image]: [string, Images]) => (
            <ImagePreview
              key={name}
              imageName={name}
              url={`${getImageUrl(title, name)}/${image.actual}`}
              isActive={name === imageName}
              onClick={onImageChange}
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
    </Container>
  );
}
