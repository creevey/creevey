import { chromium, firefox, webkit } from 'playwright-core';

/** @type import("playwright-core").LaunchOptions & { browser: 'chromium' | 'firefox' | 'webkit' } */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const config = JSON.parse(process.argv.slice(2)[0]);

const browsers = { chromium, firefox, webkit };

const ws = await browsers[config.browser].launchServer({
  ...config,
  port: 4444,
  wsPath: 'creevey',
  tracesDir: 'traces',
});

console.log(config.browser, 'browser server launched on:', ws.wsEndpoint());
