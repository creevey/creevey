import { ScrollArea, TabBar } from '@storybook/components';
import { styled } from '@storybook/theming';
import React, { FunctionComponentElement, useCallback } from 'react';
import { TestData, TestStatus } from '../../../types';
import { calcStatus } from '../../shared/helpers';
import { getEmojiByTestStatus } from '../Addon';
import { BrowserButton, TooltipWithTestNames } from './TabButtons';

interface CreeveyTabsProps {
  onSelectTest: (testId: string) => void;
  tabs: { [key: string]: TestData[] };
  selectedTestId: string;
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

const BrowserButtonTitle = styled.span({
  display: 'inline-block',
  maxWidth: '100px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  paddingRight: '5px',
});

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
  const handleSelectTest = useCallback(
    (testId: string) => {
      onSelectTest(testId);
    },
    [onSelectTest],
  );

  return (
    <Bar>
      <FlexBar>
        <TabBar key="tabs">
          {Object.entries(props.tabs).map(([browser, resultsByBrowser]) => {
            const isActive = resultsByBrowser.some((x) => x.id === props.selectedTestId);
            const browserStatus = resultsByBrowser
              .map((x) => x.status)
              .reduce((oldStatus, newStatus) => calcStatus(oldStatus, newStatus), undefined);
            const browserSkip = resultsByBrowser.length > 0 ? resultsByBrowser.every((x) => x.skip) : false;

            return resultsByBrowser.length === 1 ? (
              <BrowserButton
                id={resultsByBrowser[0].id}
                browser={browser}
                active={isActive}
                key={browser}
                onClick={handleSelectTest}
              >
                {getBrowserButtonTitle(browser, browserStatus, browserSkip, resultsByBrowser[0].testName)}
              </BrowserButton>
            ) : (
              <TooltipWithTestNames
                results={resultsByBrowser}
                key={browser}
                selectedTestId={props.selectedTestId}
                onSelect={handleSelectTest}
              >
                <BrowserButton browser={browser} active={isActive}>
                  {getBrowserButtonTitle(browser, browserStatus, browserSkip)}
                </BrowserButton>
              </TooltipWithTestNames>
            );
          })}
        </TabBar>
        {props.tools ? <Tools>{props.tools}</Tools> : null}
      </FlexBar>
    </Bar>
  );
}

function getBrowserButtonTitle(
  browser: string,
  status: TestStatus | undefined,
  skip: boolean | string | undefined,
  testName?: string,
): JSX.Element {
  return (
    <>
      <BrowserButtonTitle>
        {browser}
        {testName ? ` (${testName})` : ''}
      </BrowserButtonTitle>{' '}
      {getEmojiByTestStatus(status, skip)}
    </>
  );
}
