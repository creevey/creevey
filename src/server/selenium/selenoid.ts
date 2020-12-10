import path from 'path';
import { promisify } from 'util';
import { mkdir, writeFile, createWriteStream, unlink, copyFile } from 'fs';
import { Config, BrowserConfig, noop } from '../../types';
import { getCreeveyCache } from '../utils';
import { pullImages, runImage } from '../docker';
import { get } from 'https';
import { Octokit } from '@octokit/core';
import { execFile } from 'child_process';
import { subscribeOn } from '../messages';

const mkdirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);
const copyFileAsync = promisify(copyFile);

async function createSelenoidConfig(config: Config, { useDocker }: { useDocker: boolean }): Promise<string> {
  const selenoidConfig: {
    [browser: string]: {
      default: string;
      versions: { [version: string]: { image: string | string[]; port: string; path: string } };
    };
  } = {};
  const selenoidConfigDir = path.join(getCreeveyCache(), 'selenoid');

  (Object.values(config.browsers) as BrowserConfig[]).forEach(
    ({
      browserName,
      version = 'latest',
      dockerImage = `selenoid/${browserName}:${version}`,
      webdriverCommand = [],
    }) => {
      if (!selenoidConfig[browserName]) selenoidConfig[browserName] = { default: version, versions: {} };
      if (!useDocker && webdriverCommand.length == 0)
        throw new Error('Please specify "webdriverCommand" browser option with path to browser webdriver');
      selenoidConfig[browserName].versions[version] = {
        image: useDocker ? dockerImage : webdriverCommand,
        port: '4444',
        path: browserName == 'chrome' || browserName == 'opera' ? '/' : '/wd/hub',
      };
    },
  );

  await mkdirAsync(selenoidConfigDir, { recursive: true });
  await writeFileAsync(path.join(selenoidConfigDir, 'browsers.json'), JSON.stringify(selenoidConfig));

  return selenoidConfigDir;
}

async function downloadSelenoidBinary(destination: string): Promise<void> {
  const platformNameMapping: Partial<Record<NodeJS.Platform, string>> = {
    darwin: 'selenoid_darwin_amd64',
    linux: 'selenoid_linux_amd64',
    win32: 'selenoid_windows_amd64',
  };
  const octokit = new Octokit();
  const response = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
    owner: 'aerokube',
    repo: 'selenoid',
  });
  const { assets } = response.data;
  const { browser_download_url: downloadUrl } =
    assets.find(({ name }) => platformNameMapping[process.platform] == name) ?? {};

  if (!downloadUrl) {
    throw new Error(
      `Couldn't get download url for selenoid binary. Please download it manually from "https://github.com/aerokube/selenoid/releases/latest" and define "selenoidPath" option in the Creevey config`,
    );
  }

  return new Promise((resolve, reject) =>
    get(downloadUrl, (response) => {
      if (response.statusCode !== 200)
        return reject(new Error(`Couldn't download selenoid. Status code: ${response.statusCode ?? 'UNKNOWN'}`));

      const fileStream = createWriteStream(destination);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', (error) => {
        unlink(destination, noop);
        reject(error);
      });
    }),
  );
}

export async function startSelenoidStandalone(config: Config, debug: boolean): Promise<Config> {
  const selenoidConfigDir = await createSelenoidConfig(config, { useDocker: false });
  const binaryPath = path.join(selenoidConfigDir, 'selenoid');
  if (config.selenoidPath) {
    await copyFileAsync(path.resolve(config.selenoidPath), binaryPath);
  } else {
    await downloadSelenoidBinary(binaryPath);
  }

  const selenoidProcess = execFile(binaryPath, ['-conf', './browser.json', '-disable-docker'], {
    cwd: selenoidConfigDir,
  });

  if (debug) {
    selenoidProcess.stdout?.pipe(process.stdout);
  }
  selenoidProcess.stderr?.pipe(process.stderr);

  subscribeOn('shutdown', () => selenoidProcess.kill());

  config.gridUrl = 'http://localhost:4444/wd/hub';
  return config;
}

export async function startSelenoidContainer(config: Config, debug: boolean): Promise<string> {
  const selenoidImage = 'aerokube/selenoid:latest-release';
  const images = [selenoidImage];
  let limit = 0;

  (Object.values(config.browsers) as BrowserConfig[]).forEach(
    ({
      browserName,
      version = 'latest',
      limit: browserLimit = 1,
      dockerImage = `selenoid/${browserName}:${version}`,
    }) => {
      limit += browserLimit;
      images.push(dockerImage);
    },
  );

  const selenoidOptions = {
    name: 'selenoid',
    ExposedPorts: { '4444/tcp': {} },
    HostConfig: {
      PortBindings: { '4444/tcp': [{ HostPort: '4444' }] },
      Binds: [
        '/var/run/docker.sock:/var/run/docker.sock',
        `${await createSelenoidConfig(config, { useDocker: true })}:/etc/selenoid/:ro`,
      ],
    },
  };

  await pullImages(images);

  return runImage(selenoidImage, ['-limit', String(limit)], selenoidOptions, debug);
}
