/* eslint-disable react/display-name */
import { ScrollArea, TabBar, TabButton, TooltipLinkList, WithTooltip } from '@storybook/components';
import { styled } from '@storybook/theming';
import React, { FunctionComponentElement, useCallback } from 'react';
import { TestData } from '../../types';
import { calcStatus } from '../shared/helpers';
import { getEmojiByTestStatus } from './Addon';

interface CreeveyTabsProps {
  onSelectTest: ({ browser, testName }: { browser: string; testName?: string }) => void;
  tabs: { [key: string]: TestData[] };
  selectedTest: { browser: string; testName?: string };
  tools?: FunctionComponentElement<unknown>;
}

const FlexBar = styled.div(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  position: 'relative',
  flexWrap: 'nowrap',
  flexShrink: 0,
  height: 40,
  color: theme.barTextColor,
  boxShadow: `${theme.appBorderColor}  0 -1px 0 0 inset`,
  background: theme.barBg,
}));

export const Bar = styled(({ children }) => (
  <ScrollArea horizontal vertical={false}>
    {children}
  </ScrollArea>
))({
  width: '100%',
  height: 40,
  flexShrink: 0,
  overflow: 'auto',
  overflowY: 'hidden',
});

const Tools = styled.div({
  display: 'flex',
  whiteSpace: 'nowrap',
  flexBasis: 'auto',
  flexShrink: 0,
  marginLeft: 30,
  '& > *': {
    marginRight: 15,
  },
});

export function CreeveyTabs({ onSelectTest, ...props }: CreeveyTabsProps): JSX.Element {
  const handleSelectBrowser = useCallback(
    (browser: string) => {
      onSelectTest({ browser, testName: undefined });
    },
    [onSelectTest],
  );
  const handleSelectBrowserAndTestName = (browser: string, testName: string): void => {
    onSelectTest({ browser, testName });
  };

  // console.log(Object.entries(props.tabs));

  return (
    <Bar>
      <FlexBar>
        <TabBar key="tabs">
          {Object.entries(props.tabs).map(([browser, resultsByBrowser]) => {
            const isActive = props.selectedTest.browser === browser;
            if (resultsByBrowser.length === 1) {
              return (
                <TabButton
                  active={isActive}
                  title={browser}
                  key={browser}
                  onClick={() => handleSelectBrowser(resultsByBrowser[0].browser)}
                >
                  {`${browser} ${getEmojiByTestStatus(resultsByBrowser[0].status, resultsByBrowser[0].skip)}`}
                </TabButton>
              );
            }
            const status = resultsByBrowser
              .map((x) => x.status)
              .reduce((oldStatus, newStatus) => calcStatus(oldStatus, newStatus), undefined);
            const skip = resultsByBrowser.length > 0 ? resultsByBrowser.every((x) => x.skip) : false;
            return (
              <WithTooltip
                placement="bottom"
                trigger="click"
                key={browser}
                closeOnClick
                tooltip={({ onHide }) => {
                  return (
                    <TooltipLinkList
                      links={resultsByBrowser.map((x) => ({
                        id: x.testName || '',
                        title: `${x.testName || ''} ${getEmojiByTestStatus(x.status, x.skip)}`,
                        onClick: () => {
                          handleSelectBrowserAndTestName(x.browser, x.testName || '');
                          onHide();
                        },
                        active: isActive && props.selectedTest.testName === x.testName,
                      }))}
                    />
                  );
                }}
              >
                <TabButton active={isActive}>{`${browser} ${getEmojiByTestStatus(status, skip)}`}</TabButton>
              </WithTooltip>
            );
          })}
        </TabBar>
        {props.tools ? <Tools>{props.tools}</Tools> : null}
      </FlexBar>
    </Bar>
  );
}
