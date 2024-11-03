import React, { JSX } from 'react';
import { Button, Icons, TooltipLinkList, WithTooltip } from '@storybook/components';
import { styled } from '@storybook/theming';
import { TestData } from '../../../types.js';
import { getEmojiByTestStatus } from '../utils.js';

interface TestSelectProps {
  tests: TestData[];
  selectedTestId: string;
  onChangeTest: (testId: string) => void;
}

const LinkIconContainer = styled.span(({ theme }) => ({
  display: 'inline-block',
  width: '20px',
  color: theme.color.defaultText,
  textAlign: 'center',
}));

export default function TestSelect(props: TestSelectProps): JSX.Element {
  const testName = props.tests.find((x) => x.id === props.selectedTestId)?.testName ?? '';
  return (
    <WithTooltip
      trigger="click"
      placement="bottom"
      closeOnClick
      tooltip={({ onHide }) => (
        <TooltipLinkList
          links={props.tests.map((x) => ({
            id: x.id,
            title: x.testName ?? '',
            active: props.selectedTestId === x.id,
            onClick: () => {
              props.onChangeTest(x.id);
              onHide();
            },
            left: <LinkIconContainer>{getEmojiByTestStatus(x.status, x.skip)}</LinkIconContainer>,
          }))}
        />
      )}
    >
      <Button outline small>
        <Icons icon="menu" />
        {testName}
      </Button>
    </WithTooltip>
  );
}
