// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck

import React from 'react';
import { TestStatus } from '../../../../types';
import { CreeveyTestsStatus } from '../../../shared/helpers';
import { styled, withTheme, Theme } from '@storybook/theming';
import { IconButton, Icons } from '@storybook/components';

export interface TestsStatusProps extends CreeveyTestsStatus {
  onClickByStatus: (value: TestStatus) => void;
  theme?: Theme;
}

const Container = styled.div({
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  lineHeight: '22px',
});

const IconContainer = styled.div<{ color?: string }>(({ color }) => ({
  color: color || 'inherit',
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
    skippedCount,
    onClickByStatus,
    theme,
  }: TestsStatusProps): JSX.Element => {
    return (
      <Container>
        <Button onClick={() => onClickByStatus('pending')}>
          <IconContainer color={theme?.color.mediumdark}>
            <Icons icon="time" />
            {pendingCount}
          </IconContainer>
        </Button>
        <Divider />
        <Button onClick={() => onClickByStatus('success')}>
          <IconContainer color={theme?.color.green}>
            <Icons icon="check" /> {successCount}
          </IconContainer>
        </Button>
        <Divider />
        <Button onClick={() => onClickByStatus('failed')}>
          <IconContainer color={theme?.color.negative}>
            <Icons icon="cross" /> {failedCount}
          </IconContainer>
        </Button>
        <Divider />
        <Button>
          <IconContainer>
            <Icons icon="timer" /> {skippedCount}
          </IconContainer>
        </Button>
      </Container>
    );
  },
);
