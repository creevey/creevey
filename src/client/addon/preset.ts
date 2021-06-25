import { Configuration, DefinePlugin as FallbackDefinePlugin } from 'webpack';
import {
  isStorybookVersionLessThan,
  resolveFromStorybookCore,
  resolveFromStorybookCoreServer,
} from '../../server/storybook/helpers';

export function config(entry: string[] = []): string[] {
  return [...entry, require.resolve('./decorator')];
}

export function managerEntries(entry: string[] = []): string[] {
  return [...entry, require.resolve('./register')];
}

declare global {
  const __CREEVEY_SERVER_PORT__: number;
  const __CREEVEY_CLIENT_PORT__: number | null;
}
export interface CreeveyAddonOptions {
  creeveyPort?: number;
  clientPort?: number;
  presets?: { apply: <T>(preset: string) => Promise<T | undefined> };
}

export function managerWebpack(config: Configuration, options: CreeveyAddonOptions): Promise<Configuration> {
  return (options.presets?.apply<typeof import('webpack')>('webpackInstance') ?? Promise.resolve(undefined))
    .then(
      (webpack) =>
        webpack ??
        import(
          isStorybookVersionLessThan(6, 2)
            ? resolveFromStorybookCore('webpack')
            : resolveFromStorybookCoreServer('webpack')
        ),
    )
    .then((webpack: typeof import('webpack')) => {
      const { DefinePlugin = FallbackDefinePlugin } = webpack ?? {};
      config.plugins?.push(
        new DefinePlugin({
          __CREEVEY_SERVER_PORT__: options.creeveyPort ?? 3000,
          __CREEVEY_CLIENT_PORT__: options.clientPort,
        }),
      );
      return config;
    });
}
