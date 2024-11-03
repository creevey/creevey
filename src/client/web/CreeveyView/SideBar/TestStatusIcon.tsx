import React, { JSX } from 'react';
import { styled, withTheme, Theme } from '@storybook/theming';
import { Icons, Loader } from '@storybook/components';
import { TestStatus } from '../../../../types.js';

export interface TestStatusIconProps {
  inverted?: boolean;
  status?: TestStatus;
  skip?: string | boolean;
  theme: Theme;
}

const Container = styled.span({
  width: '16px',
  height: '13px',
  padding: 1,
  display: 'inline-block',
});

const Icon = styled(Icons)({
  position: 'relative',
  top: '1px',
  verticalAlign: 'baseline',
});

const Spinner = styled(Loader)({
  top: '12px',
  left: 'unset',
  marginLeft: '0px',
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
      case 'approved': {
        icon = <Icon color={inverted ? theme.color.lightest : theme.color.mediumdark} icon="thumbsup" />;
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
        if (skip) icon = <Icon color={inverted ? theme.color.lightest : undefined} icon="alert" />;
        else icon = <Icon color={inverted ? theme.color.lightest : undefined} icon="circlehollow" />;
        break;
      }
    }
    return <Container>{icon}</Container>;
  },
);
