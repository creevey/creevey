import { ScrollArea, TabBar } from '@storybook/components';
import { styled } from '@storybook/theming';
import React, { FunctionComponentElement } from 'react';
import { TestData } from '../../../../types';
import { calcStatus } from '../../../shared/helpers';
import { getEmojiByTestStatus } from '../../utils';
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

const TestName = styled.span({
  display: 'inline-block',
  maxWidth: '60px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
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
  return (
    <Bar>
      <FlexBar>
        <TabBar key="tabs">
          {Object.entries(props.tabs).map(([browser, tests]) => {
            const activeTest = tests.find((x) => x.id === props.selectedTestId);
            const browserStatus = tests
              .map((x) => x.status)
              .reduce((oldStatus, newStatus) => calcStatus(oldStatus, newStatus), undefined);
            const browserSkip = tests.length > 0 ? tests.every((x) => x.skip) : false;
            const emojiStatus = getEmojiByTestStatus(browserStatus, browserSkip);

            return tests.length === 1 ? (
              <BrowserButton
                id={tests[0].id}
                browser={browser}
                active={!!activeTest}
                key={browser}
                onClick={onSelectTest}
              >
                {emojiStatus} {browser}
              </BrowserButton>
            ) : (
              <TooltipWithTestNames
                results={tests}
                key={browser}
                selectedTestId={props.selectedTestId}
                onSelect={onSelectTest}
              >
                <BrowserButton browser={browser} title={activeTest?.testName} active={!!activeTest}>
                  {emojiStatus} {browser}{' '}
                  {activeTest?.testName ? (
                    <>
                      (<TestName>{activeTest.testName}</TestName>)
                    </>
                  ) : null}
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
