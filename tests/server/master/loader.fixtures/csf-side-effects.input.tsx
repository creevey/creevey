// @ts-nocheck
import React from 'react';
import { hasChildren } from './helpers';

export default { title: 'Button' };

const selector = '#root';
const tests: { [key: string]: () => Promise<void> } = {};

tests.click = async function () {
  await this.browser.findElement({ css: selector });
};

const greetings = (name: string) => `Hello ${name}`;
greetings('World').toLowerCase();

let props = {};
if (hasChildren()) props = { children: greetings('Button') };

export const Text = () => <button {...props} />;
Text.parameters = {
  creevey: { tests },
};