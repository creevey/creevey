// @ts-nocheck
import { configure, addDecorator, addParameters } from '@storybook/react';
import { withCreevey } from 'creevey';
import { hasChildren } from './helpers';

const selector = '#root';
const tests: { [key: string]: () => Promise<void> } = {};

tests.click = async function () {
  await this.browser.findElement({ css: selector });
};

const greetings = (name: string) => `Hello ${name}`;
greetings('World').toLowerCase();

let props = {};
if (hasChildren()) props = { children: greetings('Button') };

addDecorator(withCreevey(props));
addParameters({ creevey: { captureElement: 'root', tests } });

configure([require('../stories/KindA.stories')], module);