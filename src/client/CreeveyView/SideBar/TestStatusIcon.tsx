import React from 'react';
import { css } from '@emotion/core';
import DeleteIcon from '@skbkontur/react-icons/Delete';
import OkIcon from '@skbkontur/react-icons/Ok';
import ClockIcon from '@skbkontur/react-icons/Clock';
import Spinner from '@skbkontur/react-ui/Spinner';
import { TestStatus } from '../../../types';

export interface TestStatusIconProps {
  status?: TestStatus;
}

export function TestStatusIcon({ status }: TestStatusIconProps): JSX.Element | null {
  switch (status) {
    case 'failed': {
      return <DeleteIcon color="#d9472b" />;
    }
    case 'success': {
      return <OkIcon color="#419d14" />;
    }
    case 'running': {
      return (
        <span
          // NOTE Compensate spinner width
          // https://github.com/skbkontur/retail-ui/issues/1782
          css={css`
            margin-left: -0.0714285714285714em;
            margin-right: -0.0714285714285714em;
          `}
        >
          <Spinner type="mini" caption="" />
        </span>
      );
    }
    case 'pending': {
      return <ClockIcon color="#a0a0a0" />;
    }
    default: {
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
