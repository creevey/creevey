// @ts-nocheck
import React from 'react';

export default { title: 'Button' };

export const Text = () => <TestStory Component={TestButton} />;

class TestButton {
  render() {
    return <button>Hello Button</button>;
  };
}

interface TestProps {
  Component: typeof TestButton;
}

const TestStory = (props: TestProps) => <props.Component />;