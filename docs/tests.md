## Write tests

By default Creevey generate for each story very simple screenshot test. In most cases it would be enough to test your UI. But you may want to do some interactions and capture one or multiple screenshots with different states of your story. For this case you could write custom tests, like this

```tsx
import React from 'react';
import { Story } from '@storybook/react';
import { CreeveyStory } from 'creevey';
import MyComponent from './src/components/MyComponent';

export default { title: 'MyComponent' };

export const Basic: Story & CreeveyStory = () => <MyComponent />;
Basic.parameters = {
  creevey: {
    captureElement: '#root',
    tests: {
      async click() {
        await this.browser.actions().click(this.captureElement).perform();

        await this.expect(await this.takeScreenshot()).to.matchImage('clicked component');
      },
    },
  },
};
```

NOTE: Here you define story parameters with simple test `click`. Where you setup capturing element `#root` then click on that element and taking screenshot to assert it. `this.browser` allow you to access to native selenium webdriver instance you could check [API here](https://www.selenium.dev/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html).

You also could write more powerful tests with asserting multiple screenshots

```tsx
import React from 'react';
import { CSFStory } from 'creevey';
import MyForm from './src/components/MyForm';

export default { title: 'MyForm' };

export const Basic: CSFStory<JSX.Element> = () => <MyForm />;
Basic.story = {
  parameters: {
    creevey: {
      captureElement: '#root',
      delay: 1000,
      tests: {
        async submit() {
          const input = await this.browser.findElement({ css: '.my-input' });

          const empty = await this.takeScreenshot();

          await this.browser.actions().click(input).sendKeys('Hello Creevey').sendKeys(this.keys.ENTER).perform();

          const submitted = await this.takeScreenshot();

          await this.expect({ empty, submitted }).to.matchImages();
        },
      },
    },
  },
};
```

NOTE: In this example I fill some simple form and submit it. Also as you could see, I taking two different screenshots `empty` and `submitted` and assert these in the end.
