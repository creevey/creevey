import React from 'react';
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
      return <Spinner type="mini" caption="" dimmed />;
    }
    case 'pending': {
      return <ClockIcon color="#a0a0a0" />;
    }
    default: {
      return null;
    }
  }
}
