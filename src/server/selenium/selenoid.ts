import path from 'path';
import assert from 'assert';
import { lstatSync, existsSync } from 'fs';
import { mkdir, writeFile, copyFile } from 'fs/promises';
import { exec, chmod } from 'shelljs';
import { Config, BrowserConfigObject } from '../../types.js';
import { downloadBinary, getCreeveyCache, killTree } from '../utils.js';
import { pullImages, runImage } from '../docker.js';
import { subscribeOn } from '../messages.js';
import { removeWorkerContainer } from '../worker/context.js';

async function createSelenoidConfig(
  browsers: BrowserConfigObject[],
  { useDocker }: { useDocker: boolean },
): Promise<string> {
  const selenoidConfig: Partial<
    Record<
      string,
      {
        default: string;
        versions: Record<string, { image: string | string[]; port: string; path: string }>;
      }
    >
  > = {};
  const cacheDir = await getCreeveyCache();

  assert(cacheDir, "Couldn't get cache directory");

  const selenoidConfigDir = path.join(cacheDir, 'selenoid');

  browsers.forEach(
    ({
      browserName,
      seleniumCapabilities: { browserVersion = 'latest' } = {},
      dockerImage = `selenoid/${browserName}:${browserVersion}`,
      webdriverCommand = [],
    }) => {
      selenoidConfig[browserName] ??= { default: browserVersion, versions: {} };
      if (!useDocker && webdriverCommand.length == 0)
        throw new Error('Please specify "webdriverCommand" browser option with path to browser webdriver');
      selenoidConfig[browserName].versions[browserVersion] = {
        image: useDocker ? dockerImage : webdriverCommand,
        port: '4444',
        path: !useDocker || ['chrome', 'opera', 'webkit', 'MicrosoftEdge'].includes(browserName) ? '/' : '/wd/hub',
      };
    },
  );

  await mkdir(selenoidConfigDir, { recursive: true });
  await writeFile(path.join(selenoidConfigDir, 'browsers.json'), JSON.stringify(selenoidConfig));

  return selenoidConfigDir;
}

async function downloadSelenoidBinary(destination: string): Promise<void> {
  const platformNameMapping: Partial<Record<NodeJS.Platform, string>> = {
    darwin: 'selenoid_darwin_amd64',
    linux: 'selenoid_linux_amd64',
    win32: 'selenoid_windows_amd64.exe',
  };
  // TODO Replace with `import from`
  const { Octokit } = await import('@octokit/core');
  const octokit = new Octokit();
  const response = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
    owner: 'aerokube',
    repo: 'selenoid',
  });
  const { assets } = response.data;
  const { browser_download_url: downloadUrl, size: binarySize } =
    assets.find(({ name }) => platformNameMapping[process.platform] == name) ?? {};

  if (existsSync(destination) && lstatSync(destination).size == binarySize) return;

  if (!downloadUrl) {
    throw new Error(
      `Couldn't get download url for selenoid binary. Please download it manually from "https://github.com/aerokube/selenoid/releases/latest" and define "selenoidPath" option in the Creevey config`,
    );
  }

  return downloadBinary(downloadUrl, destination);
}

export async function startSelenoidStandalone(config: Config, debug: boolean): Promise<void> {
  const browsers = (Object.values(config.browsers) as BrowserConfigObject[]).filter((browser) => !browser.gridUrl);
  const selenoidConfigDir = await createSelenoidConfig(browsers, { useDocker: false });
  const binaryPath = path.join(selenoidConfigDir, process.platform == 'win32' ? 'selenoid.exe' : 'selenoid');
  if (config.selenoidPath) {
    await copyFile(path.resolve(config.selenoidPath), binaryPath);
  } else {
    await downloadSelenoidBinary(binaryPath);
  }

  // TODO Download browser webdrivers
  try {
    if (process.platform != 'win32') chmod('+x', binaryPath);
  } catch {
    /* noop */
  }

  const selenoidProcess = exec(`${binaryPath} -conf ./browsers.json -disable-docker`, {
    async: true,
    cwd: selenoidConfigDir,
  });

  if (debug) {
    selenoidProcess.stdout?.pipe(process.stdout);
    selenoidProcess.stderr?.pipe(process.stderr);
  }

  subscribeOn('shutdown', () => {
    if (selenoidProcess.pid) void killTree(selenoidProcess.pid);
  });
}

export async function startSelenoidContainer(config: Config, debug: boolean): Promise<string> {
  const browsers = (Object.values(config.browsers) as BrowserConfigObject[]).filter((browser) => !browser.gridUrl);
  const images: string[] = [];
  let limit = 0;

  browsers.forEach(
    ({
      browserName,
      seleniumCapabilities: { browserVersion = 'latest' } = {},
      limit: browserLimit = 1,
      dockerImage = `selenoid/${browserName}:${browserVersion}`,
    }) => {
      limit += browserLimit;
      images.push(dockerImage);
    },
  );

  const selenoidImage = config.dockerImage;
  const pullOptions = { auth: config.dockerAuth, platform: config.dockerImagePlatform };
  if (config.pullImages) {
    await pullImages([selenoidImage], pullOptions);
    await pullImages(images, pullOptions);
  }

  // TODO Allow pass custom options
  const selenoidOptions = {
    ExposedPorts: { '4444/tcp': {} },
    HostConfig: {
      PortBindings: { '4444/tcp': [{ HostPort: '4444' }] },
      Binds: [
        '/var/run/docker.sock:/var/run/docker.sock',
        `${await createSelenoidConfig(browsers, { useDocker: true })}:/etc/selenoid/:ro`,
      ],
    },
  };

  subscribeOn('shutdown', () => {
    void removeWorkerContainer();
  });

  return runImage(selenoidImage, ['-limit', String(limit)], selenoidOptions, debug);
}
