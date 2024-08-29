import React, { Fragment, useState, useEffect } from 'react';
import { stringify } from 'qs';
import { IconButton, Icons, Separator } from '@storybook/components';
import { styled } from '@storybook/theming';
import { ForwardIcon, NextIcon } from './Icons.js';
import { isDefined, TestData } from '../../../types.js';
import { getTestPath, useForceUpdate } from '../../shared/helpers.js';
import { CreeveyManager } from '../Manager.js';

interface ToolsProps {
  manager: CreeveyManager;
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

export const Tools = ({ manager }: ToolsProps): JSX.Element | null => {
  const [buttonClicked, setButtonClicked] = useState<ButtonType | null>();
  const [isRunning, setRunning] = useState(manager.status.isRunning);
  const forceUpdate = useForceUpdate();
  const test: TestData | undefined = manager.getCurrentTest();

  useEffect(() => {
    const unsubscribe = manager.onChangeTest(() => {
      forceUpdate();
    });
    return unsubscribe;
  }, [manager, forceUpdate]);

  useEffect(() => {
    const unsubscribe = manager.onUpdateStatus(({ isRunning }) => {
      if (isDefined(isRunning)) setRunning(isRunning);
    });
    return unsubscribe;
  }, [manager]);

  if (!test) return null;

  function renderButton(type: ButtonType, title: string, onClick: () => void, icon: JSX.Element): JSX.Element {
    const handleClick = (): void => {
      setButtonClicked(type);
      onClick();
    };
    const disabled = isRunning && buttonClicked != null && buttonClicked !== type;
    return (
      // @ts-expect-error Fixed in https://github.com/storybookjs/storybook/pull/26623
      <Button
        onClick={() => {
          if (isRunning) manager.onStop();
          else handleClick();
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
      {/* @ts-expect-error Fixed in https://github.com/storybookjs/storybook/pull/26623 */}
      <IconButton
        href={`http://localhost:${__CREEVEY_CLIENT_PORT__ ?? __CREEVEY_SERVER_PORT__ ?? 3000}/?${stringify({
          testPath: getTestPath(test),
        })}`}
        target="_blank"
        title="Show in Creevey UI"
      >
        <Icons icon="sharealt" />
      </IconButton>
      <Separator />
      {renderButton('RunAll', 'Run all', manager.onStartAllTests, <ForwardIcon />)}
      {renderButton(
        'RunStoryTests',
        'Run all story tests',
        manager.onStartAllStoryTests,
        <NextIcon width={15} height={11} />,
      )}
      {renderButton('RunTest', 'Run', manager.onStart, <Icons icon="play" />)}
    </Fragment>
  );
};
