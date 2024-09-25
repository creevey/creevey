import path from 'path';
import https from 'https';
import { exec } from 'shelljs';
import { stringify } from 'qs';
import { Config, CreeveyStatus, Options, TestData } from '../types';

const konturGitHost = 'git.skbkontur.ru';

const trackId = 232; // front_infra
const origin = 'http://localhost/';
const category = 'screenshots';
const action = 'count';
const label = 'full_run';

function buildPathname(info: Record<string, unknown>): string {
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
    const [, repoUrl] = gitRemoteOutput.stdout.match(/origin\s+(.*)\s+\(fetch\)/) ?? [];
    return [repoUrl, null];
  } catch (error) {
    return [undefined, error as Error];
  }
}

function tryGetStorybookVersion(): [string | undefined, Error | null] {
  try {
    const storybookPackageOutput = exec(`node -e "console.log(JSON.stringify(require('storybook/package.json')))"`, {
      silent: true,
    });
    const storybookPackage = JSON.parse(storybookPackageOutput) as { version: string };
    return [storybookPackage.version, null];
  } catch (error) {
    return [undefined, error as Error];
  }
}

function tryGetCreeveyVersion(): [string | undefined, Error | null] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, node/no-missing-require
    const creeveyPackage = require('creevey/package.json') as { version: string };
    return [creeveyPackage.version, null];
  } catch (error) {
    return [undefined, error as Error];
  }
}

export async function sendScreenshotsCount(
  config: Partial<Config>,
  options: Options,
  status?: CreeveyStatus,
): Promise<void> {
  const [repoUrl] = tryGetRepoUrl();

  const isKonturRepo = repoUrl?.includes(konturGitHost);

  if (!isKonturRepo || config.disableTelemetry) return;

  const [creeveyVersion, creeveyVersionError] = tryGetCreeveyVersion();
  const [storybookVersion, storybookVersionError] = tryGetStorybookVersion();

  const gridUrl = config.gridUrl ? sanitizeGridUrl(config.gridUrl) : undefined;

  const info = {
    repoUrl: repoUrl ?? 'unknown',
    creeveyVersion: creeveyVersion ?? 'unknown',
    storybookVersion: storybookVersion ?? 'unknown',
    options: options._,
    gridUrl,
    screenDir: config.screenDir ? path.relative(process.cwd(), config.screenDir) : undefined,
    useDocker: config.useDocker,
    dockerImage: config.dockerImage,
    maxRetries: config.maxRetries,
    diffOptions: config.diffOptions,
    storiesProvider: config.storiesProvider?.providerName ?? 'unknown',
    browsers: Object.fromEntries(
      Object.entries(config.browsers ?? {}).map(([name, browser]) => [
        name,
        typeof browser === 'object'
          ? {
              name: browser.name,
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
    tests: Object.values(status?.tests ?? {})
      .filter((x): x is TestData => Boolean(x))
      .map((test) => ({
        id: test.id,
        browser: test.browser,
        testName: test.testName,
        storyPath: test.storyPath,
        status: test.status,
      })),
    errors: [creeveyVersionError, storybookVersionError].some(Boolean)
      ? [
          creeveyVersionError ? `Error while getting creevey version: ${creeveyVersionError.message}` : undefined,
          storybookVersionError ? `Error while getting storybook version: ${storybookVersionError.message}` : undefined,
        ].filter(Boolean)
      : undefined,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: 'metrika.kontur.ru',
        path: buildPathname(info),
        protocol: 'https:',
      },
      (res) => {
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
      },
    );

    req.on('error', reject);

    req.end();
  });
}
