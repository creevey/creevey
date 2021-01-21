import React from 'react';
import { storiesOf } from '@storybook/react';

export default {
  title: 'KindA',
};

export const StoryA = () => <div />;

storiesOf('KindB', module)
  .add('StoryB', () => <div />);
