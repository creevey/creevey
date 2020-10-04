import React from 'react';
import { styled, withTheme, Theme } from '@storybook/theming';

const IMG_SIZE = 64;
const DIAG_LENGTH = (2 * (IMG_SIZE - 8) ** 2) ** (1 / 2);

interface ImageSwapProps {
  url: string;
  isActive: boolean;
  onClick: (imageName: string) => void;
  imageName: string;
  theme: Theme;
  error?: boolean;
}

const Button = styled.button<{ borderColor?: string }>(({ borderColor }) => ({
  appearance: 'none',
  background: 'none',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
  outline: 'none',
  zIndex: 1,
  margin: '0 10px',
  border: '2px solid transparent',
  borderColor: borderColor || 'transparent',

  '&:first-of-type': {
    marginLeft: 0,
  },
}));

const Image = withTheme(
  styled.img<{ hasBorder?: boolean; backgroundColor: string }>(({ hasBorder, backgroundColor }) => ({
    maxHeight: `${IMG_SIZE}px`,
    width: `${IMG_SIZE}px`,
    overflow: 'hidden',
    transform: hasBorder ? 'translateY(2px)' : undefined,

    '&::before': {
      content: "' '",
      display: 'block',
      height: `${IMG_SIZE - 8}px`,
      width: `${IMG_SIZE - 8}px`,
      margin: '4px',
      backgroundColor: backgroundColor,
      backgroundImage: `linear-gradient(
      45deg,
      rgba(0, 0, 0, 0) ${DIAG_LENGTH / 2 - 0.5}px,
      #e5e5e5 ${DIAG_LENGTH / 2 - 0.5}px,
      #e5e5e5 ${DIAG_LENGTH / 2 + 0.5}px,
      rgba(0, 0, 0, 0) ${DIAG_LENGTH / 2 + 0.5}px
    ),
    linear-gradient(
      315deg,
      rgba(0, 0, 0, 0) ${DIAG_LENGTH / 2 + 0.2}px,
      #e5e5e5 ${DIAG_LENGTH / 2 + 0.2}px,
      #e5e5e5 ${DIAG_LENGTH / 2 + 1.2}px,
      rgba(0, 0, 0, 0) ${DIAG_LENGTH / 2 + 1.2}px
    )`,
    },
  })),
);

export const ImagePreview = withTheme(
  ({ isActive, onClick, imageName, url, theme, error }: ImageSwapProps): JSX.Element => {
    const handleClick = (): void => onClick(imageName);

    return (
      <Button
        onClick={handleClick}
        borderColor={isActive ? theme.barSelectedColor : error ? theme.color.negative : undefined}
      >
        <Image hasBorder={isActive || error} src={url} alt={imageName} backgroundColor={theme.background.content} />
      </Button>
    );
  },
);
