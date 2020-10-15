import React from 'react';
import { styled } from '@storybook/theming';
import { Icons, Loader } from '@storybook/components';
import { TestStatus } from '../../../../types';

export interface TestStatusIconProps {
  inverted?: boolean;
  status?: TestStatus;
  skip: string | boolean;
}

const Container = styled.span({
  width: 10,
  height: 10,
  padding: 1,
  display: 'inline-block',
});

const Spinner = styled(Loader)({
  left: '40px',
});

// TODO Use storybook theme colors
export function TestStatusIcon({ inverted, status, skip }: TestStatusIconProps): JSX.Element | null {
  let icon = null;
  switch (status) {
    case 'failed': {
      icon = <Icons color={inverted ? '#fff' : '#d9472b'} icon="cross" stroke="currentColor" strokeWidth="30" />;
      break;
    }
    case 'success': {
      icon = <Icons color={inverted ? '#fff' : '#419d14'} icon="check" stroke="currentColor" strokeWidth="30" />;
      break;
    }
    case 'running': {
      icon = <Spinner size={10} />;
      break;
    }
    case 'pending': {
      icon = <Icons color={inverted ? '#fff' : '#a0a0a0'} icon="time" stroke="currentColor" strokeWidth="30" />;
      break;
    }
    default: {
      if (skip)
        icon = <Icons color={inverted ? '#fff' : undefined} icon="timer" stroke="currentColor" strokeWidth="30" />;
      break;
    }
  }
  return <Container>{icon}</Container>;
}
