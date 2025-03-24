import React, { JSX, Fragment, useState, useEffect } from 'react';
import { stringify } from 'qs';
import { IconButton, Separator } from '@storybook/components';
import { StopIcon, ShareAltIcon, PlayIcon } from '@storybook/icons';
import { styled } from '@storybook/theming';
import { ForwardIcon, NextIcon } from './Icons.js';
import { isDefined, TestData } from '../../../types.js';
import { getTestPath, useForceUpdate } from '../../shared/helpers.js';
import { CreeveyController } from '../controller.js';

interface ToolsProps {
  controller: CreeveyController;
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

export const Tools = ({ controller }: ToolsProps): JSX.Element | null => {
  const [buttonClicked, setButtonClicked] = useState<ButtonType | null>();
  const [isRunning, setRunning] = useState(controller.status.isRunning);
  const forceUpdate = useForceUpdate();
  const test: TestData | undefined = controller.getCurrentTest();

  useEffect(() => {
    const unsubscribe = controller.onChangeTest(() => {
      forceUpdate();
    });
    return unsubscribe;
  }, [controller, forceUpdate]);

  useEffect(() => {
    const unsubscribe = controller.onUpdateStatus(({ isRunning }) => {
      if (isDefined(isRunning)) setRunning(isRunning);
    });
    return unsubscribe;
  }, [controller]);

  if (!test) return null;

  function renderButton(type: ButtonType, title: string, onClick: () => void, icon: JSX.Element): JSX.Element {
    const handleClick = (): void => {
      setButtonClicked(type);
      onClick();
    };
    const disabled = isRunning && buttonClicked != null && buttonClicked !== type;
    return (
      <Button
        onClick={() => {
          if (isRunning) controller.onStop();
          else handleClick();
        }}
        title={disabled ? '' : title}
        disabled={disabled}
      >
        {buttonClicked === type && isRunning ? <StopIcon /> : icon}
      </Button>
    );
  }

  return (
    <Fragment>
      <a
        href={`http://localhost:${__CREEVEY_CLIENT_PORT__ ?? __CREEVEY_SERVER_PORT__ ?? 3000}/?${stringify({
          testPath: getTestPath(test),
        })}`}
        target="_blank"
        title="Show in Creevey UI"
        rel="noopener noreferrer"
      >
        <ShareAltIcon />
      </a>
      <Separator />
      {renderButton('RunAll', 'Run all', controller.onStartAllTests, <ForwardIcon />)}
      {renderButton(
        'RunStoryTests',
        'Run all story tests',
        controller.onStartAllStoryTests,
        <NextIcon width={15} height={11} />,
      )}
      {renderButton('RunTest', 'Run', controller.onStart, <PlayIcon />)}
    </Fragment>
  );
};
