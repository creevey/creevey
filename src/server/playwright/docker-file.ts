import semver from 'semver';
import { exec } from 'shelljs';

// TODO Support custom docker images
export function playwrightDockerFile(browser: string, version: string): string {
  const sv = semver.coerce(version);

  let npmRegistry;
  try {
    npmRegistry = exec('npm config get registry', { silent: true }).stdout.trim();
  } catch {
    /* noop */
  }

  return `
FROM mcr.microsoft.com/playwright:v${sv?.format() ?? version}

WORKDIR /creevey

RUN echo "{ \\"type\\": \\"module\\" }" > package.json && \\
    echo "import { ${browser} as browser } from 'playwright-core';" >> index.js && \\
    echo "const ws = await browser.launchServer({ port: 4444, wsPath: 'creevey' })" >> index.js && \\${
      npmRegistry
        ? `
    echo "registry=${npmRegistry}" > .npmrc && \\`
        : ''
    }
    npm i playwright-core${sv ? `@${sv.format()}` : ''}

EXPOSE 4444

ENTRYPOINT [ "node", "./index.js" ]
`;
}
