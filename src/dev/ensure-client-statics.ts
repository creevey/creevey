import fs from 'fs';
import path from 'path';
import { getClientDir } from '../server/utils.js';

const getClientIndexHtml = (): string => path.join(getClientDir(), 'index.html');

const getViteConfigPath = (): string => path.resolve(getClientDir(), '../../../vite.config.mts');

const getRepoViteConfigPath = (runtimeDir: string): string => path.join(runtimeDir, '../vite.config.mts');

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export const isLocalSourceCheckout = (runtimeDir: string): boolean => fs.existsSync(getRepoViteConfigPath(runtimeDir));

export const shouldEnsureClientStaticsForCommand = (command: 'report' | 'test' | 'worker'): boolean =>
  command === 'report' || command === 'test';

export async function ensureClientStaticsForLocalDev(): Promise<void> {
  const indexHtml = getClientIndexHtml();

  if (fs.existsSync(indexHtml)) return;

  console.log('Building Creevey web UI...');

  try {
    const { build } = await import('vite');

    await build({
      configFile: getViteConfigPath(),
      logLevel: 'error',
    });

    if (!fs.existsSync(indexHtml)) {
      throw new Error('index.html was not generated.');
    }
  } catch (error: unknown) {
    throw new Error(`Failed to build Creevey web UI: ${getErrorMessage(error)}`);
  }
}
