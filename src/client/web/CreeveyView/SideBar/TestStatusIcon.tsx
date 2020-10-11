import React from 'react';
import { styled } from '@storybook/theming';
import { Icons, Loader } from '@storybook/components';
import { TestStatus } from '../../../../types';

export interface TestStatusIconProps {
  inverted?: boolean;
  status?: TestStatus;
  skip: string | boolean;
}

const Icon = styled(Icons)<{ color?: string }>(({ color }) => ({
  color: color,
  width: 10,
  height: 10,
  display: 'inline-block',
}));

const Container = styled.span({
  width: 12,
  height: 12,
  display: 'inline-block',
});

const Spinner = styled(Loader)({
  left: '40px',
});

export function TestStatusIcon({ inverted, status, skip }: TestStatusIconProps): JSX.Element | null {
  let icon = null;
  switch (status) {
    case 'failed': {
      icon = <Icon color={inverted ? '#fff' : '#d9472b'} icon="cross" />;
      break;
    }
    case 'success': {
      icon = <Icon color={inverted ? '#fff' : '#419d14'} icon="check" />;
      break;
    }
    case 'running': {
      icon = <Spinner size={10} />;
      break;
    }
    case 'pending': {
      icon = <Icon color={inverted ? '#fff' : '#a0a0a0'} icon="time" />;
      break;
    }
    default: {
      if (skip) icon = <Icon color={inverted ? '#fff' : undefined} icon="timer" />;
      break;
    }
  }
  return <Container>{icon}</Container>;
}
