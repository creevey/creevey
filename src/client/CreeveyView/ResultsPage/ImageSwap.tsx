import React from 'react';
import { css } from '@emotion/core';

interface ImageSwapProps {
  url: string;
  isActual: boolean;
  onClick: () => void;
  imageName?: string;
}

export function ImageSwap({ isActual, onClick, imageName, url }: ImageSwapProps): JSX.Element {
  const borderStyle = isActual
    ? `border: 1px solid #3072C4; outline: 1px solid #3072C4;`
    : 'border: 1px solid #a0a0a0;';

  return (
    <span
      css={css`
        height: 64px;
        width: 64px;
        margin: 0 8px;
        ${borderStyle}

        &:hover {
          cursor: pointer;
        }

        &:focus {
          outline: 1px solid #3072c4;
        }
      `}
      onClick={onClick}
      onKeyPress={onClick}
      role="button"
      tabIndex={0}
    >
      {imageName ? (
        <img
          css={css`
            width: 100%;
            height: 100%;
          `}
          src={`${url}/${imageName}`}
          alt={name}
        />
      ) : (
        <>
          <div
            css={css`
              position: relative;
              top: 31px;
              right: 8px;
              width: 78px;
              border: 1px solid #e5e5e5;
              transform: rotate(45deg);
            `}
          />
          <div
            css={css`
              position: relative;
              top: 29px;
              width: 78px;
              right: 8px;
              border: 1px solid #e5e5e5;
              transform: rotate(-45deg);
            `}
          />
        </>
      )}
    </span>
  );
}
