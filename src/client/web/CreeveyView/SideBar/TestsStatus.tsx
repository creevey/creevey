import React from 'react';
import { TestStatus } from '../../../../types';
import { CreeveyTestsStatus } from '../../../shared/helpers';
import { styled } from '@storybook/theming';
import { IconButton, Icons } from '@storybook/components';

export interface TestsStatusProps extends CreeveyTestsStatus {
  onClickByStatus: (value: TestStatus) => void;
}

const Container = styled.div({
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  lineHeight: '22px',
  width: '230px',
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
    marginRight: 2,
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

export function TestsStatus({
  successCount,
  failedCount,
  pendingCount,
  skippedCount,
  removedCount,
  onClickByStatus,
}: TestsStatusProps): JSX.Element {
  return (
    <Container>
      {pendingCount > 0 && (
        <>
          <IconButton onClick={() => onClickByStatus('pending')}>
            <IconContainer color="#a0a0a0">
              <Icons icon="time" />
              {pendingCount}
            </IconContainer>
          </IconButton>
          <Divider />
        </>
      )}
      <IconButton onClick={() => onClickByStatus('success')}>
        <IconContainer color="#228007">
          <Icons icon="check" /> {successCount}
        </IconContainer>
      </IconButton>
      <Divider />
      <IconButton onClick={() => onClickByStatus('failed')}>
        <IconContainer color="#ce0014">
          <Icons icon="cross" /> {failedCount}
        </IconContainer>
      </IconButton>
      <Divider />
      <IconButton>
        <IconContainer>
          <Icons icon="timer" /> {skippedCount}
        </IconContainer>
      </IconButton>
      <Divider />
      <IconButton>
        <IconContainer>
          <Icons icon="trash" /> {removedCount}
        </IconContainer>
      </IconButton>
    </Container>
  );
}
