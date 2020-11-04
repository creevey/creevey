import React from 'react';
import { TestStatus } from '../../../../types';
import { CreeveyTestsStatus } from '../../../shared/helpers';
import { styled, withTheme, Theme } from '@storybook/theming';
import { IconButton, Icons } from '@storybook/components';

export interface TestsStatusProps extends CreeveyTestsStatus {
  onClickByStatus: (value: TestStatus) => void;
  theme: Theme;
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
    console.log(theme.color);
    return (
      <Container>
        <Button onClick={() => onClickByStatus('pending')}>
          <IconContainer color={theme.color.mediumdark}>
            <Icons icon="time" stroke="currentColor" strokeWidth="30" />
            {pendingCount}
          </IconContainer>
        </Button>
        <Divider />
        <Button onClick={() => onClickByStatus('success')}>
          <IconContainer color={theme.color.green}>
            <Icons icon="check" stroke="currentColor" strokeWidth="30" /> {successCount}
          </IconContainer>
        </Button>
        <Divider />
        <Button onClick={() => onClickByStatus('failed')}>
          <IconContainer color={theme.color.negative}>
            <Icons icon="cross" stroke="currentColor" strokeWidth="30" /> {failedCount}
          </IconContainer>
        </Button>
        <Divider />
        <Button>
          <IconContainer>
            <Icons icon="timer" stroke="currentColor" strokeWidth="30" /> {skippedCount}
          </IconContainer>
        </Button>
      </Container>
    );
  },
);
