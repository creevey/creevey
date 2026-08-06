import { chromium, firefox, webkit } from 'playwright-core';

/** @type import("playwright-core").LaunchOptions & { browser: 'chromium' | 'firefox' | 'webkit' } */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const config = JSON.parse(process.argv.slice(2)[0]);

const browsers = { chromium, firefox, webkit };

const ws = await browsers[config.browser].launchServer({
  // NOTE: Bind to all interfaces, playwright >=1.62 defaults to localhost, which is unreachable through docker's published port
  host: '0.0.0.0',
  ...config,
  port: 4444,
  wsPath: 'creevey',
  tracesDir: 'traces',
});

console.log(config.browser, 'browser server launched on:', ws.wsEndpoint());
