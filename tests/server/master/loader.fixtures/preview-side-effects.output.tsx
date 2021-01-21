// @ts-nocheck
import { configure, addParameters } from '@storybook/react';



const selector = '#root';
const tests = {};

tests.click = async function () {
  await this.browser.findElement({ css: selector });
};








addParameters({ creevey: { captureElement: 'root', tests } });

configure([require('../stories/KindA.stories')], module);