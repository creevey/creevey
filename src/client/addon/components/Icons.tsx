import React from 'react';

interface IconProps {
  width?: number;
  height?: number;
}

export const NextIcon = ({ width, height }: IconProps): JSX.Element => {
  return (
    <svg version="1.1" width={width} height={height} viewBox="0 0 306 306">
      <path d="M0,306l216.75-153L0,0V306z M255,0v306h51V0H255z" fill="currentColor" />
    </svg>
  );
};

export const ForwardIcon = ({ width, height }: IconProps): JSX.Element => {
  return (
    <svg version="1.1" width={width} height={height} viewBox="0 0 512 512">
      <path
        fill="currentColor"
        d="M460.9,246.8l-209-164.2c-7.8-6.1-19.2-0.6-19.2,9.2v328.4c0,9.8,11.4,15.3,19.2,9.2l209-164.2c5.1-4,6-11.4,2-16.5
		C462.4,248,461.7,247.3,460.9,246.8L460.9,246.8z M228.2,246.8L19.2,82.5C11.4,76.4,0,82,0,91.8v328.4c0,9.8,11.4,15.3,19.2,9.2
		l209-164.2c3-2.3,4.5-5.8,4.5-9.2C232.7,252.6,231.2,249.1,228.2,246.8z M507.3,64h-37.2c-2.5,0-4.7,2-4.7,4.4v375.3
		c0,2.4,2.1,4.4,4.7,4.4h37.2c2.5,0,4.7-2,4.7-4.4V68.4C512,66,509.9,64,507.3,64z"
      />
    </svg>
  );
};
