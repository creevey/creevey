"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playwrightDockerFile = playwrightDockerFile;
const promises_1 = require("fs/promises");
const url_1 = require("url");
const semver_1 = __importDefault(require("semver"));
const shelljs_1 = __importDefault(require("shelljs"));
const detect_1 = require("package-manager-detector/detect");
const importMetaUrl = (0, url_1.pathToFileURL)(__filename).href;
const getRegistryCommand = {
    npm: 'npm config get registry --workspaces=false --include-workspace-root',
    yarn: 'yarn config get registry',
    'yarn@berry': 'yarn config get npmRegistryServer',
};
// TODO Support custom docker images
async function playwrightDockerFile(browser, version, npmRegistry) {
    const sv = semver_1.default.coerce(version);
    if (!npmRegistry) {
        const { agent } = (await (0, detect_1.detect)()) ?? {};
        const command = agent ? getRegistryCommand[agent] : getRegistryCommand.npm;
        try {
            npmRegistry = shelljs_1.default
                // NOTE: https://github.com/npm/cli/issues/6099#issuecomment-2062122615
                .exec(command, { silent: true })
                .stdout.trim();
        }
        catch {
            /* noop */
        }
    }
    const indexJs = await (0, promises_1.readFile)(new URL('./index-source.mjs', importMetaUrl), 'utf-8');
    const dockerfile = `
FROM node:lts

WORKDIR /creevey

RUN echo "{ \\"type\\": \\"module\\" }" > package.json && \\
${indexJs
        .split('\n')
        .map((line) => `    echo "${line.replace(/"/g, '\\"')}" >> index.js && \\`)
        .join('\n')}
    ${npmRegistry
        ? `
    echo "registry=${npmRegistry}" > .npmrc && \\`
        : ''}
    npm i playwright-core${sv ? `@${sv.format()}` : ''} && \\
    npx -y playwright${sv ? `@${sv.format()}` : ''} install --with-deps ${browser}

EXPOSE 4444

ENTRYPOINT [ "node", "./index.js" ]
`;
    return dockerfile.replace(/\\\n\s*\\?\n/g, '\\\n');
}
//# sourceMappingURL=docker-file.js.map