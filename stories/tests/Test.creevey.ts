import { kind, story, test } from '../../src/server/parser';

kind('TestKind', () => {
  story('Story', ({ setStoryParameters }) => {
    setStoryParameters({
      skip: false,
      waitForReady: false,
      captureElement: 'span[data-test-id~="x"]',
      ignoreElements: [],
    });

    test('idletest', async function () {
      await this.expect(await this.takeScreenshot()).to.matchImage('idleimage');
    });

    test('idletest2', async function () {
      await this.expect(await this.takeScreenshot()).to.matchImage('idleimage2');
    });
  });
});
