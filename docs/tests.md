## Write interactive screenshot tests

In most cases following Storybook's ideology of [writing stories](https://storybook.js.org/docs/get-started/whats-a-story) is enough to test your UI components. Where each component has a separate stories file with its different states. But sometimes you might have pretty complicated components with a lot of interactions and internal states. In this case, you can write tests for your stories.

There are two different ways how to write interactive tests with Creevey:

### Write tests in `*.creevey.ts` files

It's the recommended way to write tests. It allows you to run these tests by Creevey itself and utilize webdriver benefits. The crucial part of it is webdriver action calls are more close to real user interactions and mitigate flakiness and false-negative results. Here is a simple example of how to write tests in `*.creevey.ts` files

```ts
// stories/MyComponent.creevey.ts
import { kind, story, test } from 'creevey';

kind('MyComponent', () => {
  story('Story', ({ setStoryParameters }) => {
    // It's possible to pass Creevey parameters to story
    setStoryParameters({
      captureElement: 'span[data-test-id~="x"]',
      ignoreElements: [],
    });

    test('idle', async (context) => {
      await context.matchImage(await context.takeScreenshot());
    });

    test('input', async (context) => {
      await context.webdriver.keyboard.press('Tab');
      const focus = await context.takeScreenshot();
      await context.webdriver.keyboard.type('Hello Creevey');
      const input = await context.takeScreenshot();
      await context.matchImages({ focus, input });
    });
  });
});
```

In the example above, we used Playwright API to interact with the story. But Creevey also supports Selenium webdriver. And in that case `context.webdriver` will be an instance of Selenium webdriver. Obviously Selenium API is different from Playwright.

### Using Storybook's `play` function

Storybook allows you to write tests in the story file itself by using [`play` function](https://storybook.js.org/docs/writing-tests/component-testing). It's a good way to write simple tests. But there are couple drawbacks of this approach:

- You can have only one test per story. Which is not a big deal, but sometimes you might not want to have multiple stories with the same markup.
- Tests are running in browser environment and use https://testing-library.com API under the hood. It's good for unit tests, but might not be suitable for visual regression tests, because testing-library relies on DOM API and not even close to real user interactions. For example, you might have a button that could be visible for user, but it's covered by some other transparent element. With testing-library the button easily accessible and clickable, but the user can't interact with it.

Here is an example of how to write tests using Storybook's `play` function:

```tsx
// stories/MyComponent.stories.tsx
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { fireEvent, within } from '@storybook/test';
import MyComponent from './src/components/MyComponent';

export default {
  title: 'MyComponent',
  component: MyComponent,
};

export const Basic: StoryObj<typeof MyComponent> = {
  play: async ({ canvasElement }) => {
    const slider = await within(canvasElement).findByTestId('slider');

    await fireEvent.change(slider, { target: { value: 50 } });
  },
};
```
