import path from 'path';
import https from 'https';
import { exec } from 'shelljs';
import { stringify } from 'qs';
import { set } from 'lodash';
import { v4 } from 'uuid';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
import { Config, CreeveyStatus, isDefined, Options } from '../types.js';

const konturGitHost = 'git.skbkontur.ru';

const trackId = 232; // front_infra
const origin = 'http://localhost/';
const category = 'tests_run';
const action = 'done';

function buildPathname(label: string, info: Record<string, unknown>): string {
  return `/track-event?${stringify({
    id: trackId,
    c: category,
    a: action,
    l: label,
    cv: JSON.stringify(info),
    ts: new Date().toISOString(),
    url: origin,
  })}`;
}

function sanitizeGridUrl(gridUrl: string): string {
  const url = new URL(gridUrl);

  url.username = url.username ? '********' : '';
  url.password = url.password ? '********' : '';

  return url.toString();
}

function tryGetRepoUrl(): [string | undefined, Error | null] {
  try {
    const gitRemoteOutput = exec('git remote -v', { silent: true });
    const [, repoUrl] = /origin\s+(.*)\s+\(fetch\)/.exec(gitRemoteOutput.stdout) ?? [];
    return [repoUrl, null];
  } catch (error) {
    return [undefined, error as Error];
  }
}

function tryGetRootPath(): [string | undefined, Error | null] {
  try {
    const gitRevParseOutput = exec('git rev-parse --show-toplevel', { silent: true });
    return [gitRevParseOutput.stdout.trim(), null];
  } catch (error) {
    return [undefined, error as Error];
  }
}

function tryGetStorybookVersion(): [string | undefined, Error | null] {
  try {
    const storybookPackageOutput = exec(`node -e "console.log(JSON.stringify(require('storybook/package.json')))"`, {
      silent: true,
    });
    const storybookPackage = JSON.parse(storybookPackageOutput.stdout) as { version: string };
    return [storybookPackage.version, null];
  } catch (error) {
    return [undefined, error as Error];
  }
}

function tryGetCreeveyVersion(): [string | undefined, Error | null] {
  try {
    const importMetaUrl = pathToFileURL(__filename).href;
    const _require = createRequire(importMetaUrl);
    const creeveyPackage = _require('creevey/package.json') as { version: string };
    return [creeveyPackage.version, null];
  } catch (error) {
    return [undefined, error as Error];
  }
}

function sendRequest(options: https.RequestOptions): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else if (res.statusCode >= 300 && res.statusCode < 400) {
          reject(new Error(`Redirection error: ${res.statusCode}`));
        } else if (res.statusCode >= 400 && res.statusCode < 500) {
          reject(new Error(`Client error: ${res.statusCode}`));
        } else if (res.statusCode >= 500 && res.statusCode < 600) {
          reject(new Error(`Server error: ${res.statusCode}`));
        } else {
          reject(new Error(`Unexpected status code: ${res.statusCode}`));
        }
      } else {
        reject(new Error('No status code received'));
      }
    });

    req.on('error', reject);

    req.end();
  });
}

export async function sendScreenshotsCount(
  config: Partial<Config>,
  options: Options,
  status?: CreeveyStatus,
): Promise<void> {
  const [repoUrl] = tryGetRepoUrl();

  const isKonturRepo = repoUrl?.includes(konturGitHost);

  if (!isKonturRepo || config.disableTelemetry) return;

  const uuid = v4();

  const [creeveyVersion, creeveyVersionError] = tryGetCreeveyVersion();
  const [storybookVersion, storybookVersionError] = tryGetStorybookVersion();
  const [gitRootPath] = tryGetRootPath();

  const gridUrl = config.gridUrl ? sanitizeGridUrl(config.gridUrl) : undefined;

  const configMeta = {
    runId: uuid,
    repoUrl: repoUrl ?? 'unknown',
    creeveyVersion: creeveyVersion ?? 'unknown',
    storybookVersion: storybookVersion ?? 'unknown',
    options: options._,
    gridUrl,
    screenDir: config.screenDir ? path.relative(gitRootPath ?? process.cwd(), config.screenDir) : undefined,
    useDocker: config.useDocker,
    dockerImage: config.dockerImage,
    maxRetries: config.maxRetries,
    diffOptions: config.diffOptions,
    storiesProvider: config.storiesProvider?.providerName ?? 'unknown',
    errors: [creeveyVersionError, storybookVersionError].some(Boolean)
      ? [
          creeveyVersionError ? `Error while getting creevey version: ${creeveyVersionError.message}` : undefined,
          storybookVersionError ? `Error while getting storybook version: ${storybookVersionError.message}` : undefined,
        ].filter(Boolean)
      : undefined,
  };

  const browsersMeta = {
    runId: uuid,
    browsers: Object.fromEntries(
      Object.entries(config.browsers ?? {}).map(([name, browser]) => [
        name,
        typeof browser === 'object'
          ? {
              name: name,
              gridUrl: browser.gridUrl ? sanitizeGridUrl(browser.gridUrl) : undefined,
              browserName: browser.browserName,
              browserVersion: browser.browserVersion,
              platformName: browser.platformName,
              viewport: browser.viewport,
              limit: browser.limit,
              dockerImage: browser.dockerImage,
              'se:teamname': browser['se:teamname'],
            }
          : browser,
      ]),
    ),
  };

  const tests: Record<string, unknown> = {};

  Object.values(status?.tests ?? {})
    .filter(isDefined)
    .forEach((test) => {
      set(tests, [...test.storyPath, test.testName, test.browser].filter(isDefined), test.id);
    });

  const testsMeta = { runId: uuid, tests };

  const fullPathname = buildPathname('tests', testsMeta);
  // NOTE: Keep request path shorter than 32k symbols
  const chunksCount = Math.ceil(fullPathname.length / 32_000);
  let chunks: string[] = [];
  if (chunksCount > 1) {
    const testsString = JSON.stringify(tests);
    const chunkSize = Math.ceil(testsString.length / chunksCount);
    chunks = Array.from({ length: chunksCount })
      .map((_, chunkIndex) => testsString.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize))
      .map((testsPart, seq) => buildPathname('tests', { runId: uuid, seq, tests: testsPart }));
  } else {
    chunks = [fullPathname];
  }

  await Promise.all([
    sendRequest({
      host: 'metrika.kontur.ru',
      path: buildPathname('config', configMeta),
      protocol: 'https:',
    }),
    sendRequest({
      host: 'metrika.kontur.ru',
      path: buildPathname('browsers', browsersMeta),
      protocol: 'https:',
    }),
    ...chunks.map((chunk) =>
      sendRequest({
        host: 'metrika.kontur.ru',
        path: chunk,
        protocol: 'https:',
      }),
    ),
  ]);
}
