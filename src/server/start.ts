import { Tests, Workers } from "../types";

export default function startTests(tests: Tests, workers: Workers) {
  const flattenTests: { [browser: string]: Array<{ kind: string; story: string; test: string }> } = {};
  const browsers = Object.keys(workers);
  const workerPromises: Promise<void>[] = [];

  browsers.forEach(browser => (flattenTests[browser] = []));

  Object.entries(tests).forEach(([kind, kindTests]) =>
    Object.entries(kindTests).forEach(([story, storyTests]) =>
      storyTests.forEach(({ test, skip = [] }) =>
        browsers
          .filter(browser => skip.includes(browser))
          .forEach(browser => flattenTests[browser].push({ kind, story, test }))
      )
    )
  );

  browsers.forEach(browser => {
    workers[browser].forEach(worker => {
      workerPromises.push(
        new Promise(resolve => {
          function runTest() {
            const test = flattenTests[browser].shift();
            if (!test) {
              resolve();
            }
            worker.send(JSON.stringify({ type: "runTest", payload: test }));
          }
          worker.on("message", (message: string) => {
            const event = JSON.parse(message);

            // TODO send event
            // sucess, failed
            console.log(event);

            runTest();
          });

          runTest();
        })
      );
    });
  });

  return Promise.all(workerPromises);
}
