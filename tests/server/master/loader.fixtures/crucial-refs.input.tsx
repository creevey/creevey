// @ts-nocheck
import React from 'react';
import Button from './src/Button';

export default { title: 'Button' };

export const Text = () => <TestButton />;

class TestButton extends React.Component {
  public static defaultState = {};

  public state = TestButton.defaultState;

  public render(): JSX.Element {
    return <Button>Hello Button</Button>;
  };
}