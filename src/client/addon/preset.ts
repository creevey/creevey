import path from 'path';
import { exec } from 'shelljs';
import { Configuration, DefinePlugin as FallbackDefinePlugin } from 'webpack';
import { resolveFromStorybookCoreServer } from '../../server/storybook/helpers';

export function config(entry: string[] = []): string[] {
  return [...entry, require.resolve('./decorator')];
}

export function managerEntries(entry: string[] = []): string[] {
  return [...entry, require.resolve('./register')];
}

declare global {
  const __CREEVEY_SERVER_HOST__: string;
  const __CREEVEY_SERVER_PORT__: number;
  const __CREEVEY_CLIENT_PORT__: number | null;
}
export interface CreeveyAddonOptions {
  creeveyConfigPath?: string;
  creeveyPreExtract?: string;
  creeveyHost?: string;
  creeveyPort?: number;
  clientPort?: number;
  configType: string;
  configDir: string;
  outputDir: string;
  skipExtract?: boolean;
  presets?: { apply: <T>(preset: string) => Promise<T | undefined> };
}

export function managerWebpack(config: Configuration, options: CreeveyAddonOptions): Promise<Configuration> {
  // TODO How to execute with non-webpack bundlers
  if (options.configType == 'PRODUCTION' && options.skipExtract != true) {
    const args: string[] = [];
    if (options.creeveyPreExtract) args.push(`--require "${options.creeveyPreExtract}"`);
    args.push(path.join(__dirname, '../../cli'));
    args.push(`--extract "${options.outputDir}"`);
    if (options.creeveyConfigPath) args.push(`--config "${options.creeveyConfigPath}"`);

    exec(`node ${args.join(' ')}`, { async: true });
  }
  return (options.presets?.apply<typeof import('webpack')>('webpackInstance') ?? Promise.resolve(undefined))
    .then((webpack) => webpack ?? import(resolveFromStorybookCoreServer('webpack')))
    .then((webpack: typeof import('webpack')) => {
      const { DefinePlugin = FallbackDefinePlugin } = webpack ?? {};
      config.plugins?.push(
        new DefinePlugin({
          __CREEVEY_SERVER_HOST__: options.creeveyHost,
          __CREEVEY_SERVER_PORT__: options.creeveyPort ?? 3000,
          __CREEVEY_CLIENT_PORT__: options.clientPort,
        }),
      );
      return config;
    });
}
