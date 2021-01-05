import React, { Fragment, useState, useContext } from 'react';
import { IconButton, Icons, Separator } from '@storybook/components';
import { ForwardIcon, NextIcon } from './../Icons';
import { stringify } from 'qs';
import { styled } from '@storybook/theming';
import { CreeveyContext } from '../CreeveyContext';
import { TestData } from '../../../types';
import { getTestPath } from '../../shared/helpers';

interface ToolsProps {
  test: TestData;
}

const Button = styled(IconButton)({
  '&:disabled': {
    opacity: 0.5,
    cursor: 'default',
  },

  '&:disabled:hover': {
    color: 'inherit',
  },
});

type ButtonType = 'RunAll' | 'RunStoryTests' | 'RunTest';

export const Tools = ({ test }: ToolsProps): JSX.Element => {
  const { onStart, onStartAllTests, onStartStoryTests, onStop, isRunning } = useContext(CreeveyContext);
  const [buttonClicked, setButtonClicked] = useState<ButtonType | null>();

  function renderButton(type: ButtonType, title: string, onClick: () => void, icon: JSX.Element): JSX.Element {
    const handleClick = (): void => {
      setButtonClicked(type);
      onClick();
    };
    const disabled = isRunning && buttonClicked != null && buttonClicked !== type;
    return (
      <Button
        onClick={() => {
          isRunning ? onStop() : handleClick();
        }}
        title={disabled ? '' : title}
        disabled={disabled}
      >
        {buttonClicked === type && isRunning ? <Icons icon={'stop'} /> : icon}
      </Button>
    );
  }

  return (
    <Fragment>
      <IconButton
        href={`http://localhost:${__CREEVEY_CLIENT_PORT__ || __CREEVEY_SERVER_PORT__}/?${stringify({
          testPath: getTestPath(test),
        })}`}
        target="_blank"
        title="Show in Creevey UI"
      >
        <Icons icon="sharealt" />
      </IconButton>
      <Separator />
      {renderButton('RunAll', 'Run all', onStartAllTests, <ForwardIcon />)}
      {renderButton('RunStoryTests', 'Run all story tests', onStartStoryTests, <NextIcon width={15} height={11} />)}
      {renderButton('RunTest', 'Run', () => onStart([test.id]), <Icons icon="play" />)}
    </Fragment>
  );
};
