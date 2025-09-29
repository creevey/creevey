import { FakeTest, Images, isDefined, TEST_EVENTS } from '../../types.js';
import EventEmitter from 'events';

export class TeamcityReporter {
  constructor(runner: EventEmitter, options: { reportDir: string; topLevelSuite?: string }) {
    const { reportDir, topLevelSuite = 'Creevey Tests' } = options;

    console.log("##teamcity[testRetrySupport enabled='true']");

    runner.on(TEST_EVENTS.RUN_BEGIN, () => {
      console.log(`##teamcity[flowStarted flowId='${process.pid}']`);
      console.log(`##teamcity[testSuiteStarted name='${this.escape(topLevelSuite)}' flowId='${process.pid}']`);
    });

    runner.on(TEST_EVENTS.TEST_BEGIN, (test: FakeTest) => {
      const flowId = test.creevey.workerId;
      const testName = this.escape(test.fullTitle());
      console.log(`##teamcity[flowStarted flowId='${flowId}' parent='${process.pid}']`);
      console.log(`##teamcity[testStarted name='${testName}' flowId='${flowId}']`);
    });

    runner.on(TEST_EVENTS.TEST_PASS, (test: FakeTest) => {
      const flowId = test.creevey.workerId;
      const testName = this.escape(test.fullTitle());
      const duration = test.duration ?? 0;
      console.log(`##teamcity[testFinished name='${testName}' flowId='${flowId}' duration='${duration}']`);
      console.log(`##teamcity[flowFinished flowId='${flowId}']`);
    });

    runner.on(TEST_EVENTS.TEST_FAIL, (test: FakeTest, error: Error) => {
      const flowId = test.creevey.workerId;
      const duration = test.duration ?? 0;
      const testName = this.escape(test.fullTitle());
      const browserName = this.escape(test.creevey.browserName);
      const messageStr = error instanceof Error ? error.message : String(error);
      const detailsStr = error instanceof Error ? (error.stack ?? '') : '';
      Object.entries(test.creevey.images).forEach(([name, image]) => {
        if (!image) return;
        const filePath = test
          .titlePath()
          .slice(0, -1)
          .concat(name == browserName ? [] : [browserName])
          .map(this.escape)
          .join('/');

        const { error: _, ...rest } = image;
        Object.values(rest as Partial<Images>)
          .filter(isDefined)
          .forEach((fileName) => {
            console.log(`##teamcity[publishArtifacts '${reportDir}/${filePath}/${fileName} => report/${filePath}']`);
            console.log(
              `##teamcity[testMetadata type='image' value='report/${filePath}/${fileName}' flowId='${flowId}']`,
            );
          });
      });

      console.log(
        `##teamcity[testFailed name='${testName}' message='${this.escape(
          messageStr,
        )}' details='${this.escape(detailsStr)}' flowId='${flowId}' duration='${duration}']`,
      );
      console.log(`##teamcity[testFinished name='${testName}' flowId='${flowId}' duration='${duration}']`);
      console.log(`##teamcity[flowFinished flowId='${flowId}']`);
    });

    runner.on(TEST_EVENTS.RUN_END, () => {
      console.log(`##teamcity[testSuiteFinished name='${this.escape(topLevelSuite)}' flowId='${process.pid}']`);
      console.log(`##teamcity[flowFinished flowId='${process.pid}']`);
    });
  }

  private escape = (str: string): string => {
    if (!str) return '';
    return (
      str
        .toString()
        // Remove ANSI SGR color sequences
        .replace(new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g'), '')
        // TeamCity escapes
        .replace(/\|/g, '||')
        .replace(/\n/g, '|n')
        .replace(/\r/g, '|r')
        .replace(/\[/g, '|[')
        .replace(/\]/g, '|]')
        .replace(/\u0085/g, '|x')
        .replace(/\u2028/g, '|l')
        .replace(/\u2029/g, '|p')
        .replace(/'/g, "|'")
    );
  };
}
