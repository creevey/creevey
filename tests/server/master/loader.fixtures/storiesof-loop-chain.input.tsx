// @ts-nocheck
import React from 'react';
import { storiesOf } from '@storybook/react';

const stories = storiesOf('Button', module);

['Text', 'Emoji']
  .forEach(story =>
    stories.add(story, () => <button>{story}</button>)
  );