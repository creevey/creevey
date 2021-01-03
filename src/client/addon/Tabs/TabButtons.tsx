import { TabButton, TooltipLinkList, WithTooltip } from '@storybook/components';
import { styled } from '@storybook/theming';
import React, { useCallback } from 'react';
import { TestData } from '../../../types';
import { getEmojiByTestStatus } from '../Addon';

const LinkIconContainer = styled.span(({ theme }) => ({
  display: 'inline-block',
  width: '20px',
  color: theme.color.defaultText,
  textAlign: 'center',
}));

interface BrowserButtonProps {
  browser: string;
  id?: string;
  active: boolean;
  onClick?: (id: string) => void;
  children: React.ReactChild;
}

export const BrowserButton = ({ browser, id, active, onClick, children }: BrowserButtonProps): JSX.Element => {
  const handleClick = useCallback(() => {
    if (onClick && id) onClick(id);
  }, [id, onClick]);
  return (
    <TabButton value={browser} active={active} title={browser} onClick={handleClick}>
      {children}
    </TabButton>
  );
};

interface TooltipWithTestNamesProps {
  results: TestData[];
  selectedTestId: string;
  onSelect: (id: string) => void;
  children: React.ReactChild;
}

export const TooltipWithTestNames = ({
  results,
  onSelect,
  selectedTestId,
  children,
}: TooltipWithTestNamesProps): JSX.Element => {
  const getLinks = (onHide: () => void): { id: string; title: string; onClick: () => void; active: boolean }[] => {
    return results.map((x) => ({
      id: x.id,
      title: x.testName ?? '',
      onClick: () => {
        onSelect(x.id);
        onHide();
      },
      left: <LinkIconContainer>{getEmojiByTestStatus(x.status, x.skip)}</LinkIconContainer>,
      active: selectedTestId === x.id,
    }));
  };

  return (
    <WithTooltip
      placement="bottom"
      trigger="click"
      closeOnClick
      tooltip={({ onHide }) => {
        return <TooltipLinkList links={getLinks(onHide)} />;
      }}
    >
      {children}
    </WithTooltip>
  );
};
