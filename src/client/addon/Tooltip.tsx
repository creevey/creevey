import React from 'react';
import { IconButton, Icons, WithTooltip, TooltipLinkList } from '@storybook/components';
import { stringify } from 'qs';

interface TooltipProps {
  testPath: string[];
}

export const Tooltip = ({ testPath }: TooltipProps): JSX.Element => {
  return (
    <WithTooltip
      placement="top"
      trigger="click"
      closeOnClick
      tooltip={({ onHide }) => (
        <TooltipLinkList
          links={[
            {
              onClick: () => onHide(),
              id: '1',
              title: 'Show in Creevey UI',
              target: 'blank',
              href: `http://localhost:${__CREEVEY_CLIENT_PORT__ || __CREEVEY_SERVER_PORT__}/?${stringify({
                testPath,
              })}`,
            },
          ]}
        />
      )}
    >
      <IconButton>
        <Icons icon="ellipsis" />
      </IconButton>
    </WithTooltip>
  );
};
