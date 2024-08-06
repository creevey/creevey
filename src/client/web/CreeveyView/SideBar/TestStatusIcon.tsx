import React from 'react';
import { styled, withTheme, Theme } from '@storybook/theming';
import { Icons, Loader } from '@storybook/components';
import { TestStatus } from '../../../../types';

export interface TestStatusIconProps {
  inverted?: boolean;
  status?: TestStatus;
  skip?: string | boolean;
  theme: Theme;
}

const Container = styled.span({
  width: 10,
  height: 10,
  padding: 1,
  display: 'inline-block',
});

const Icon = styled(Icons)({
  position: 'relative',
  top: '1.5px',
  verticalAlign: 'baseline',
});

const Spinner = styled(Loader)({
  top: '14px',
  left: '42px',
});

export const TestStatusIcon = withTheme(
  ({ inverted, status, skip, theme }: TestStatusIconProps): JSX.Element | null => {
    let icon = null;
    switch (status) {
      case 'failed': {
        icon = <Icon color={inverted ? theme.color.lightest : theme.color.negative} icon="cross" />;
        break;
      }
      case 'success': {
        icon = <Icon color={inverted ? theme.color.lightest : theme.color.green} icon="check" />;
        break;
      }
      case 'running': {
        icon = <Spinner size={10} />;
        break;
      }
      case 'pending': {
        icon = <Icon color={inverted ? theme.color.lightest : theme.color.mediumdark} icon="time" />;
        break;
      }
      default: {
        if (skip) icon = <Icon color={inverted ? theme.color.lightest : undefined} icon="timer" />;
        break;
      }
    }
    return <Container>{icon}</Container>;
  },
);
