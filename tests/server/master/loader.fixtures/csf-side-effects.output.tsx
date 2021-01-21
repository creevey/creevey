// @ts-nocheck



export default { title: 'Button' };

const selector = '#root';
const tests = {};

tests.click = async function () {
  await this.browser.findElement({ css: selector });
};







export const Text = () => {};
Text.parameters = {
  creevey: { tests } };