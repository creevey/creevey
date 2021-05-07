// @ts-nocheck

import { storiesOf } from '@storybook/react';

const stories = storiesOf('Button', module);

['Text', 'Emoji'].
forEach((story) =>
stories.add(story, () => {}));