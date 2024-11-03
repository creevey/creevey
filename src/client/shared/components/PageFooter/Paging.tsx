import React, { JSX } from 'react';
import { TabButton } from '@storybook/components';

export interface PagingProps {
  activePage: string;
  onPageChange: (pageNumber: number) => void;
  pagesCount: number;
}

export function Paging(props: PagingProps): JSX.Element {
  const renderItem = (item: string, index: number): JSX.Element => {
    switch (item) {
      case '.': {
        return (
          // @ts-expect-error Fixed in https://github.com/storybookjs/storybook/pull/26623
          <TabButton
            disabled
            key={`dots${index < 5 ? 'Left' : 'Right'}`}
            autoFocus={false}
            content={''}
            nonce={''}
            rel={''}
            rev={''}
          >
            {'...'}
          </TabButton>
        );
      }

      default: {
        return (
          // @ts-expect-error Fixed in https://github.com/storybookjs/storybook/pull/26623
          <TabButton
            rel={item}
            rev={item}
            autoFocus={false}
            nonce={item}
            content={item}
            key={item}
            onClick={() => {
              goToPage(item);
            }}
            active={props.activePage === item}
          >
            {item}
          </TabButton>
        );
      }
    }
  };

  const goToPage = (pageNumber: string): void => {
    const newPage = Number(pageNumber);
    if (1 <= newPage && pageNumber !== props.activePage && newPage <= props.pagesCount) {
      props.onPageChange(newPage);
    }
  };

  return <div>{getItems(props.activePage, props.pagesCount).map(renderItem)}</div>;
}

function getItems(activePage: string, total: number): string[] {
  const active = Number(activePage);
  const result: string[] = [];

  const left = Math.max(Math.min(active - 2, total - 4), 1);
  const right = Math.min(Math.max(5, active + 2), total);

  const hasLeftDots = left > 3;
  const from = hasLeftDots ? left : 1;

  const hasRightDots = right < total - 2;
  const to = hasRightDots ? right : total;

  if (hasLeftDots) {
    result.push('1', '.');
  }

  for (let i = from; i <= to; ++i) {
    result.push(`${i}`);
  }

  if (hasRightDots) {
    result.push('.');
  }

  if (hasRightDots && isFinite(total)) {
    result.push(`${total}`);
  }

  return result;
}
