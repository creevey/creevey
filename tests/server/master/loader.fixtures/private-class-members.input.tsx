import React from 'react';

export default { title: 'Button' };

class Button extends React.Component {
  #text = 'Hello Button'

  // @ts-expect-error: this is a bug https://github.com/microsoft/TypeScript/issues/39066#issuecomment-689522685
  #greetings() {
    return this.#text
  }

  render() {
    return <button>{this.#greetings()}</button>;
  }
}

export const Text = () => <Button />;