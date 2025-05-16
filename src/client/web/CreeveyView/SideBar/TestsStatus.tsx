import React, { JSX } from 'react';
import { IconButton } from '@storybook/components';
import { TimeIcon, CheckIcon, CrossIcon, ThumbsUpIcon } from '@storybook/icons';
import { styled, withTheme, Theme } from '@storybook/theming';
import { TestStatus } from '../../../../types.js';
import { CreeveyTestsStatus } from '../../../shared/helpers.js';

export interface TestsStatusProps extends CreeveyTestsStatus {
  onClickByStatus: (value: TestStatus) => void;
  theme?: Theme;
}

const Container = styled.div({
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  lineHeight: '22px',
  padding: '2px 6px',
});

const IconContainer = styled.div<{ color?: string }>(({ color }) => ({
  color: color ?? 'inherit',
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  margin: '0 4px',

  '&:first-of-type': {
    marginLeft: 0,
  },

  '& svg': {
    marginRight: 5,
    width: 10,
    height: 10,
  },
}));

const Divider = styled.div({
  '&::before': {
    content: "'/'",
    display: 'block',
    marginRight: 4,
  },
});

const Button = styled(IconButton)({
  marginTop: 0,
  padding: 0,
  height: '24px',
});

export const TestsStatus = withTheme(
  ({
    successCount,
    failedCount,
    pendingCount,
    approvedCount,
    onClickByStatus,
    theme,
  }: TestsStatusProps): JSX.Element => {
    return (
      <Container>
        <Button
          onClick={() => {
            onClickByStatus('pending');
          }}
        >
          <IconContainer color={theme?.color.mediumdark}>
            <TimeIcon />
            {pendingCount}
          </IconContainer>
        </Button>
        <Divider />
        <Button
          onClick={() => {
            onClickByStatus('success');
          }}
        >
          <IconContainer color={theme?.color.green}>
            <CheckIcon /> {successCount}
          </IconContainer>
        </Button>
        <Divider />
        <Button
          onClick={() => {
            onClickByStatus('failed');
          }}
        >
          <IconContainer color={theme?.color.negative}>
            <CrossIcon /> {failedCount}
          </IconContainer>
        </Button>
        <Divider />
        <Button
          onClick={() => {
            onClickByStatus('approved');
          }}
        >
          <IconContainer color={theme?.color.defaultText}>
            <ThumbsUpIcon /> {approvedCount}
          </IconContainer>
        </Button>
      </Container>
    );
  },
);
