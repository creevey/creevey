import React from 'react';
import { styled, withTheme, Theme, keyframes, ensure, ThemeProvider, themes } from '@storybook/theming';
import { isUseDarkTheme } from './themeUtils';

const Container = withTheme(
  styled.div(({ theme }) => ({
    height: '100vh',
    width: '100vw',
    background: theme.background.app,
  })),
);

const Loader = withTheme(
  styled.div<{ size?: number; theme: Theme }>(({ size = 32, theme }) => ({
    borderRadius: '50%',
    cursor: 'progress',
    display: 'inline-block',
    overflow: 'hidden',
    position: 'absolute',
    transition: 'all 200ms ease-out',
    verticalAlign: 'top',
    top: '50%',
    left: '50%',
    marginTop: -(size / 2),
    marginLeft: -(size / 2),
    height: size,
    width: size,
    zIndex: 4,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: theme.base === 'light' ? 'rgba(97, 97, 97, 0.29)' : 'rgba(255, 255, 255, 0.2)',
    borderTopColor: theme.base === 'light' ? 'rgb(100,100,100)' : 'rgba(255, 255, 255, 0.4)',
    animation: `${rotate360} 0.7s linear infinite`,
    mixBlendMode: 'difference',
  })),
);

export const rotate360 = keyframes`
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
`;

export function CreeveyLoader() {
  const isDarkTheme = isUseDarkTheme();
  return (
    <ThemeProvider theme={ensure(isDarkTheme ? themes.dark : themes.light)}>
      <Container>
        <Loader size={64} />
      </Container>
    </ThemeProvider>
  );
}
