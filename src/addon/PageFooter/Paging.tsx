import React from 'react';

import { Button, Icons } from '@storybook/components';
import { noop } from '../../types';

export interface PagingProps {
  activePage: number;
  onPageChange: (pageNumber: number) => void;
  pagesCount: number;
}

export type ItemType = number | '.' | 'forward';

export function Paging(props: PagingProps): JSX.Element {
  const renderItem = (item: ItemType, index: number): JSX.Element => {
    switch (item) {
      case '.': {
        return (
          <Button disabled key={`dots${index < 5 ? 'Left' : 'Right'}`}>
            {'...'}
          </Button>
        );
      }
      case 'forward': {
        const disabled = props.activePage === props.pagesCount;
        return (
          <Button
            outline
            disabled={disabled}
            onClick={disabled ? noop : () => goToPage(props.activePage + 1)}
            key="forward"
          >
            <span>
              Next <Icons icon="arrowright" />
            </span>
          </Button>
        );
      }
      default: {
        return (
          <Button outline secondary={props.activePage === item} key={item} onClick={() => goToPage(item)}>
            {item}
          </Button>
        );
      }
    }
  };

  const goToPage = (pageNumber: number): void => {
    if (1 <= pageNumber && pageNumber !== props.activePage && pageNumber <= props.pagesCount) {
      props.onPageChange(pageNumber);
    }
  };

  return <span>{getItems(props.activePage, props.pagesCount).map(renderItem)}</span>;
}

function getItems(active: number, total: number): ItemType[] {
  const result: ItemType[] = [];

  const left = Math.max(Math.min(active - 2, total - 4), 1);
  const right = Math.min(Math.max(5, active + 2), total);

  const hasLeftDots = left > 3;
  const from = hasLeftDots ? left : 1;

  const hasRightDots = right < total - 2;
  const to = hasRightDots ? right : total;

  if (hasLeftDots) {
    result.push(1, '.');
  }

  for (let i = from; i <= to; ++i) {
    result.push(i);
  }

  if (hasRightDots) {
    result.push('.');
  }

  if (hasRightDots && isFinite(total)) {
    result.push(total);
  }

  return result.concat('forward');
}
