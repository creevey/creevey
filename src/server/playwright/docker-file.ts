import semver from 'semver';
import { exec } from 'shelljs';
import { LaunchOptions } from 'playwright-core';
import { resolvePlaywrightBrowserType } from '../utils';

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
    echo "import { ${resolvePlaywrightBrowserType(browser)} as browser } from 'playwright-core';" >> index.js && \\
    echo "const ws = await browser.launchServer({ ...${JSON.stringify(serverOptions)}, port: 4444, wsPath: 'creevey' })" >> index.js && \\${
      npmRegistry
        ? `
    echo "registry=${npmRegistry}" > .npmrc && \\`
        : ''
    }
    npm i playwright-core${sv ? `@${sv.format()}` : ''} && \\
    npx -y playwright${sv ? `@${sv.format()}` : ''} install --with-deps ${browser}

EXPOSE 4444

ENTRYPOINT [ "node", "./index.js" ]
`;
}
