import React from 'react';
import { IconButton, Icons, WithTooltip, TooltipLinkList } from '@storybook/components';

interface TooltipProps {
  storyId: string;
  browser: string;
}

export const Tooltip = ({ storyId, browser }: TooltipProps): JSX.Element => {
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
              href: `http://localhost:${__CREEVEY_CLIENT_PORT__ || __CREEVEY_SERVER_PORT__}/?storyId=${
                storyId || ''
              }&browser=${browser}`,
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
