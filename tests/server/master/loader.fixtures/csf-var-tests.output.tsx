

const buttonTests = captureElement => ({
  async click() {
    await this.browser.actions().click(captureElement).perform();

    await this.expect(await this.takeScreenshot()).to.matchImage('clicked button');
  } });


export default { title: 'Button' };

export const Text = () => {};
Text.story = {
  parameters: {
    creevey: {
      delay: 1000,
      tests: buttonTests('button') } } };