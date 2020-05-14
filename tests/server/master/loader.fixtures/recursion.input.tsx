// @ts-nocheck
import React from 'react';

export default { title: 'Button' };

export const Text = () => <TestButton />;

class TestButton extends React.Component {
  public render(): JSX.Element {
    return <TestButton />;
  };
}