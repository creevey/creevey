import React from 'react';
import { css } from '@emotion/core';
import DeleteIcon from '@skbkontur/react-icons/Delete';
import OkIcon from '@skbkontur/react-icons/Ok';
import ClockIcon from '@skbkontur/react-icons/Clock';
import PauseIcon from '@skbkontur/react-icons/Pause';
import { Spinner } from '@skbkontur/react-ui';
import { TestStatus } from '../../../types';

export interface TestStatusIconProps {
  inverted?: boolean;
  status?: TestStatus;
  skip: string | boolean;
}

export function TestStatusIcon({ inverted, status, skip }: TestStatusIconProps): JSX.Element | null {
  switch (status) {
    case 'failed': {
      return <DeleteIcon color={inverted ? '#fff' : '#d9472b'} />;
    }
    case 'success': {
      return <OkIcon color={inverted ? '#fff' : '#419d14'} />;
    }
    case 'running': {
      return <Spinner type="mini" caption="" dimmed={inverted} />;
    }
    case 'pending': {
      return <ClockIcon color={inverted ? '#fff' : '#a0a0a0'} />;
    }
    default: {
      if (skip) return <PauseIcon color={inverted ? '#fff' : undefined} />;
      return (
        <span
          css={css`
            padding: 7px;
          `}
        />
      );
    }
  }
}
