import React from 'react';
import { css } from '@emotion/core';
import { Button, Hint } from '@skbkontur/react-ui';

const IMG_SIZE = 64;
const DIAG_LENGTH = (2 * (IMG_SIZE - 8) ** 2) ** (1 / 2);

interface ImageSwapProps {
  url: string;
  isActive: boolean;
  onClick: (imageName: string) => void;
  imageName: string;
}

export function ImagePreview({ isActive, onClick, imageName, url }: ImageSwapProps): JSX.Element {
  const handleClick = (): void => onClick(imageName);

  return (
    <Hint text={imageName}>
      <Button checked={isActive} onClick={handleClick}>
        <span
          css={css`
            display: flex;
            text-align: center;
            align-items: center;
            justify-content: center;
          `}
        >
          <img
            css={css`
              max-height: ${IMG_SIZE}px;
              width: ${IMG_SIZE}px;
              overflow: hidden;

              ${isActive
                ? 'transform: translateY(-1px); &:active { transform: translateY(1px); }'
                : '&:active { transform: translateY(-1px); }'}

              &::before {
                content: ' ';
                display: block;
                height: ${IMG_SIZE - 8}px;
                width: ${IMG_SIZE - 8}px;
                margin: 4px;
                background-color: #fff;
                background-image: linear-gradient(
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
                  );
              }
            `}
            src={url}
            alt={imageName}
          />
        </span>
      </Button>
    </Hint>
  );
}
