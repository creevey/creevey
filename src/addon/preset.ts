import { Configuration, DefinePlugin } from 'webpack';

export function managerEntries(entry: string[] = []): string[] {
  return [...entry, require.resolve('./../register')];
}

declare global {
  const __creeveyPort__: number;
}
export interface CreeveyAddonOptions {
  creeveyPort?: number;
}
export function managerWebpack(config: Configuration, options: CreeveyAddonOptions): Configuration {
  config.plugins?.push(
    new DefinePlugin({
      __creeveyPort__: options.creeveyPort || 3000,
    }),
  );
  return config;
}
