import { readFile } from 'fs/promises';
import { pathToFileURL } from 'url';
import semver from 'semver';
import sh from 'shelljs';
import { detect } from 'package-manager-detector/detect';

const importMetaUrl = pathToFileURL(__filename).href;

const getRegistryCommand: Record<string, string> = {
  npm: 'npm config get registry --workspaces=false --include-workspace-root',
  yarn: 'yarn config get registry',
  'yarn@berry': 'yarn config get npmRegistryServer',
};

// TODO Support custom docker images
export async function playwrightDockerFile(browser: string, version: string, npmRegistry?: string): Promise<string> {
  const sv = semver.coerce(version);

  if (!npmRegistry) {
    const { agent } = (await detect()) ?? {};
    const command = agent ? getRegistryCommand[agent] : getRegistryCommand.npm;
    try {
      npmRegistry = sh
        // NOTE: https://github.com/npm/cli/issues/6099#issuecomment-2062122615
        .exec(command, { silent: true })
        .stdout.trim();
    } catch {
      /* noop */
    }
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
