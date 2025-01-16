import semver from 'semver';
import { exec } from 'shelljs';
import { LaunchOptions } from 'playwright-core';

const browserMap: Record<string, string> = {
  chromium: 'chromium',
  'chromium-headless-shell': 'chromium',
  chrome: 'chromium',
  'chrome-beta': 'chromium',
  msedge: 'chromium',
  'msedge-beta': 'chromium',
  'msedge-dev': 'chromium',
  'bidi-chromium': 'chromium',
  firefox: 'firefox',
  webkit: 'webkit',
};

// TODO Support custom docker images
export function playwrightDockerFile(browser: string, version: string, serverOptions?: LaunchOptions): string {
  const sv = semver.coerce(version);

  let npmRegistry;
  try {
    npmRegistry = exec('npm config get registry', { silent: true }).stdout.trim();
  } catch {
    /* noop */
  }

  return `
FROM node:lts

WORKDIR /creevey

RUN echo "{ \\"type\\": \\"module\\" }" > package.json && \\
    echo "import { ${browserMap[browser]} as browser } from 'playwright-core';" >> index.js && \\
    echo "const ws = await browser.launchServer({ ...${JSON.stringify(serverOptions)}, port: 4444, wsPath: 'creevey' })" >> index.js && \\${
      npmRegistry
        ? `
    echo "registry=${npmRegistry}" > .npmrc && \\`
        : ''
    }
    npx -y playwright${sv ? `@${sv.format()}` : ''} install --with-deps ${browser} && \\
    npm i playwright-core${sv ? `@${sv.format()}` : ''}

EXPOSE 4444

ENTRYPOINT [ "node", "./index.js" ]
`;
}
