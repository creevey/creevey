import React, { JSX } from 'react';
import { styled, withTheme, Theme } from '@storybook/theming';
import { Loader } from '@storybook/components';
import { CrossIcon, CheckIcon, CircleHollowIcon, ThumbsUpIcon, AlertIcon, TimeIcon } from '@storybook/icons';
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

const iconStyles = {
  position: 'relative',
  top: '1px',
  verticalAlign: 'baseline',
} as const;

const CrossIconStyled = styled(CrossIcon)(iconStyles);
const CheckIconStyled = styled(CheckIcon)(iconStyles);
const ThumbsUpIconStyled = styled(ThumbsUpIcon)(iconStyles);
const AlertIconStyled = styled(AlertIcon)(iconStyles);
const TimeIconStyled = styled(TimeIcon)(iconStyles);
const CircleHollowIconStyled = styled(CircleHollowIcon)(iconStyles);

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
        icon = <CrossIconStyled color={inverted ? theme.color.lightest : theme.color.negative} />;
        break;
      }
      case 'success': {
        icon = <CheckIconStyled color={inverted ? theme.color.lightest : theme.color.green} />;
        break;
      }
      case 'approved': {
        icon = <ThumbsUpIconStyled color={inverted ? theme.color.lightest : theme.color.mediumdark} />;
        break;
      }
      case 'running': {
        icon = <Spinner size={10} />;
        break;
      }
      case 'pending': {
        icon = <TimeIconStyled color={inverted ? theme.color.lightest : theme.color.mediumdark} />;
        break;
      }
      default: {
        if (skip) icon = <AlertIconStyled color={inverted ? theme.color.lightest : undefined} />;
        else icon = <CircleHollowIconStyled color={inverted ? theme.color.lightest : undefined} />;
        break;
      }
    }
    return <Container>{icon}</Container>;
  },
);
