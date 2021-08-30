import type { StorybookConfig } from '@storybook/core-common';
import path from 'path';
import resolveFrom from 'resolve-from';

const supportedFrameworks = [
  'react',
  'vue',
  'vue3',
  'angular',
  'marionette',
  'mithril',
  'marko',
  'html',
  'svelte',
  'riot',
  'ember',
  'preact',
  'rax',
  'aurelia',
  'server',
  'web-components',
];

export const storybookDirRef = { current: path.resolve('.storybook') };
export const resolveFromStorybook = (modulePath: string): string => resolveFrom(storybookDirRef.current, modulePath);

export const resolveFromStorybookAddonDocs = (modulePath: string): string =>
  resolveFrom(resolveFromStorybook('@storybook/addon-docs'), modulePath);
export const resolveFromStorybookBuilderWebpack4 = (modulePath: string): string =>
  resolveFrom(resolveFromStorybook('@storybook/builder-webpack4'), modulePath);
export const resolveFromStorybookCore = (modulePath: string): string =>
  resolveFrom(resolveFromStorybook('@storybook/core'), modulePath);
export const resolveFromStorybookCoreServer = (modulePath: string): string =>
  resolveFrom(resolveFromStorybook('@storybook/core-server'), modulePath);

const importFromStorybook = <T>(modulePath: string): Promise<T> =>
  import(resolveFromStorybook(modulePath)) as Promise<T>;

export const importStorybookClientLogger = <T = typeof import('@storybook/client-logger')>(): Promise<T> =>
  importFromStorybook<T>('@storybook/client-logger');

export const importStorybookCoreCommon = <T = typeof import('@storybook/core-common')>(): Promise<T> =>
  importFromStorybook<T>('@storybook/core-common');

export const importStorybookCoreEvents = <T = typeof import('@storybook/core-events')>(): Promise<T> =>
  importFromStorybook<T>('@storybook/core-events');

export function hasDocsAddon(): boolean {
  try {
    resolveFromStorybook('@storybook/addon-docs');
    return true;
  } catch (_) {
    return false;
  }
}
export function hasSvelteCSFAddon(): boolean {
  try {
    resolveFromStorybook('@storybook/addon-svelte-csf');
    return true;
  } catch (_) {
    return false;
  }
}

export function getStorybookVersion(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { version } = require(resolveFromStorybook('@storybook/core/package.json')) as {
    version: string;
  };

  return version;
}

export function isStorybookVersionLessThan(major: number, minor?: number): boolean {
  const [sbMajor, sbMinor] = (process.env.__CREEVEY_STORYBOOK_VERSION__ ?? getStorybookVersion()).split('.');

  return Number(sbMajor) < major || (minor != undefined && Number(sbMajor) == major && Number(sbMinor) < minor);
}

export function isStorybookVersion(major: number, minor?: number): boolean {
  const [sbMajor, sbMinor] = (process.env.__CREEVEY_STORYBOOK_VERSION__ ?? getStorybookVersion()).split('.');

  return Number(sbMajor) == major || (minor != undefined && Number(sbMajor) == major && Number(sbMinor) == minor);
}

export function getStorybookFramework(): string {
  const framework =
    process.env.__CREEVEY_STORYBOOK_FRAMEWORK__ ??
    supportedFrameworks.find((framework) => {
      try {
        return require.resolve(resolveFromStorybook(`@storybook/${framework}`));
      } catch (_) {
        return false;
      }
    });

  if (!framework)
    throw new Error(
      "Couldn't detect used Storybook framework. Please ensure that you install `@storybook/<framework>` package",
    );

  return framework;
}

export const storybookConfigRef: { current: StorybookConfig } = { current: { stories: [] } };

export async function importStorybookConfig(): Promise<StorybookConfig> {
  const configPath = `${storybookDirRef.current}/main`;
  try {
    return (storybookConfigRef.current = (
      (await import(require.resolve(configPath))) as { default: StorybookConfig }
    ).default);
  } catch (_) {
    const storybookUtilsPath = isStorybookVersionLessThan(6, 2)
      ? '@storybook/core/dist/server/utils'
      : '@storybook/core-common/dist/cjs/utils';
    const serverRequireModule = isStorybookVersionLessThan(6, 2) ? 'server-require' : 'interpret-require';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { getInterpretedFile } = await import(resolveFromStorybook(`${storybookUtilsPath}/interpret-files`));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { default: serverRequireFallback, serverRequire = serverRequireFallback } = await import(
      resolveFromStorybook(`${storybookUtilsPath}/${serverRequireModule}`)
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mainConfigFile = isStorybookVersionLessThan(6, 1)
      ? configPath
      : // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        getInterpretedFile(configPath);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    return (storybookConfigRef.current = serverRequire(mainConfigFile) as StorybookConfig);
  }
}

export async function isCSFv3Enabled(): Promise<boolean> {
  return (await importStorybookConfig())?.features?.previewCsfV3 ?? false;
}
