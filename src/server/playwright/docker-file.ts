import semver from 'semver';

// TODO Support custom docker images
export function playwrightDockerFile(browser: string, version: string): string {
  const sv = semver.coerce(version);

  return `
FROM mcr.microsoft.com/playwright:v${sv?.format() ?? version}

WORKDIR /creevey

RUN echo "{ \\"type\\": \\"module\\" }" > package.json && \\
    echo "import { ${browser} as browser } from 'playwright-core';" >> index.js && \\
    echo "const ws = await browser.launchServer({ port: 4444, wsPath: 'creevey' })" >> index.js && \\
    npm i playwright-core${sv ? `@${sv.format()}` : ''}

EXPOSE 4444

ENTRYPOINT [ "node", "./index.js" ]
`;
}
