## Creevey Storybook Parameters

Creevey allows you to customize how stories will be captured. You could define parameters on `global`, `kind` or `story` levels. All these parameters are deeply merged by Storybook for each story.

```ts
// .storybook/preview.tsx
export const parameters = {
  creevey: {
    // Global parameters are applied to all stories
    captureElement: '#storybook-root',
  },
};
```

```ts
// stories/MyModal.stories.tsx
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { CreeveyMeta, CreeveyStory } from 'creevey';
import MyModal from './src/components/MyModal';

const Kind: Meta<typeof MyModal> = {
  title: 'MyModal',
  component: MyModal,
  parameters: {
    creevey: {
      // It's possible to add additional delay before capturing screenshot
      delay: 1000,

      // For capturing the whole browser viewport, you can define `null` instead of css selector.
      captureElement: null,

      // You can skip some stories from capturing, by defining `skip` option:
      // skip: { "The reason why story is skipped": { in: 'chrome', stories: 'Loading' } }
      // - `in` - browser name, regex or array of browser names, which are defined in the Creevey config
      // - `stories` - story name, regex or array of story names
      // - `tests` - test name, regex or array of test names
      // NOTE: If you try to skip stories by story name, the storybook name format will be used
      // For more info see [storybook-export-vs-name-handling](https://storybook.js.org/docs/formats/component-story-format/#storybook-export-vs-name-handling))
      skip: {
        "`MyModal` doesn't support ie11": { in: 'ie11' },
        'Loading stories are flaky in firefox': { in: 'firefox', stories: 'Loading' },
        "`MyModal` hovering doesn't work correctly": {
          in: ['firefox', 'chrome'],
          tests: /.*hover$/,
        },
      },
    },
  },
};

export default Kind;

export const Basic: StoryObj<typeof MyModal> = {
  creevey: {
    // Lastly some elements can be ignored in capturing screenshot
    ignoreElements: ['button', '.local-time'],
  },
};
```
