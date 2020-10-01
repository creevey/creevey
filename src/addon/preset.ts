import { Configuration, DefinePlugin } from 'webpack';

export function config(entry: string[] = []): string[] {
  return [...entry, require.resolve('./decorator')];
}

export function managerEntries(entry: string[] = []): string[] {
  return [...entry, require.resolve('./register')];
}

declare global {
  const __CREEVEY_SERVER_PORT__: number;
}
export interface CreeveyAddonOptions {
  creeveyPort?: number;
}
export function managerWebpack(config: Configuration, options: CreeveyAddonOptions): Configuration {
  config.plugins?.push(
    new DefinePlugin({
      __CREEVEY_SERVER_PORT__: options.creeveyPort || 3000,
    }),
  );
  return config;
}
