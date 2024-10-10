import { TestStatus } from '../../types.js';

export function getEmojiByTestStatus(status: TestStatus | undefined, skip: string | boolean = false): string {
  switch (status) {
    case 'failed': {
      return '❌';
    }
    case 'success': {
      return '✔';
    }
    case 'running': {
      return '🟡';
    }
    case 'pending': {
      return '🕗';
    }
    default: {
      if (skip) return '⏸';
      return '';
    }
  }
}

export const isInternetExplorer = navigator.userAgent.includes('Trident/');
