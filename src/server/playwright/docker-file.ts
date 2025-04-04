import { readFile } from 'fs/promises';
import { pathToFileURL } from 'url';
import semver from 'semver';
import { exec } from 'shelljs';

const importMetaUrl = pathToFileURL(__filename).href;

// TODO Support custom docker images
export async function playwrightDockerFile(browser: string, version: string): Promise<string> {
  const sv = semver.coerce(version);

  let npmRegistry;
  try {
    npmRegistry = exec('npm config get registry', { silent: true }).stdout.trim();
  } catch {
    /* noop */
  }

  const indexJs = await readFile(new URL('./index-source.mjs', importMetaUrl), 'utf-8');

  const dockerfile = `
FROM node:lts

WORKDIR /creevey

RUN echo "{ \\"type\\": \\"module\\" }" > package.json && \\
${indexJs
  .split('\n')
  .map((line) => `    echo "${line.replace(/"/g, '\\"')}" >> index.js && \\`)
  .join('\n')}
    ${
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

  return dockerfile.replace(/\\\n\s*\\?\n/g, '\\\n');
}
