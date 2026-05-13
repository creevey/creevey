import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const build = vi.fn();

vi.mock('vite', () => ({
  build,
}));

import {
  ensureClientStaticsForLocalDev,
  shouldEnsureClientStaticsForCommand,
} from '../../src/dev/ensure-client-statics.js';
import { getClientDir } from '../../src/server/utils.js';

describe('shouldEnsureClientStaticsForCommand', () => {
  test('returns true for report', () => {
    expect(shouldEnsureClientStaticsForCommand('report', {})).toBe(true);
  });

  test('returns true for test with ui enabled', () => {
    expect(shouldEnsureClientStaticsForCommand('test', { ui: true })).toBe(true);
  });

  test('returns false for test without ui enabled', () => {
    expect(shouldEnsureClientStaticsForCommand('test', { ui: false })).toBe(false);
    expect(shouldEnsureClientStaticsForCommand('test', {})).toBe(false);
  });

  test('returns false for other commands', () => {
    expect(shouldEnsureClientStaticsForCommand('worker', { ui: true })).toBe(false);
  });
});

describe('ensureClientStaticsForLocalDev', () => {
  const clientDir = getClientDir();
  const indexHtml = path.join(clientDir, 'index.html');
  const viteConfig = path.resolve(path.dirname(indexHtml), '../../../vite.config.mts');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns immediately when built statics already exist', async () => {
    const existsSync = vi.spyOn(fs, 'existsSync').mockImplementation((filePath) => filePath === indexHtml);

    await expect(ensureClientStaticsForLocalDev()).resolves.toBeUndefined();

    expect(build).not.toHaveBeenCalled();
    expect(existsSync).toHaveBeenCalledTimes(1);
    expect(existsSync).toHaveBeenCalledWith(indexHtml);
  });

  test('builds the web UI when statics are missing', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
      if (filePath === indexHtml) {
        return build.mock.calls.length > 0;
      }

      return false;
    });

    await expect(ensureClientStaticsForLocalDev()).resolves.toBeUndefined();

    expect(log).toHaveBeenCalledWith('Building Creevey web UI...');
    expect(build).toHaveBeenCalledWith({
      configFile: viteConfig,
      logLevel: 'error',
    });
  });

  test('throws a clear error when the build fails', async () => {
    const error = new Error('boom');
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    build.mockRejectedValueOnce(error);

    await expect(ensureClientStaticsForLocalDev()).rejects.toThrow('Failed to build Creevey web UI: boom');
  });

  test('throws a clear error when the build finishes without index.html', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    await expect(ensureClientStaticsForLocalDev()).rejects.toThrow(
      'Failed to build Creevey web UI: index.html was not generated.',
    );
  });
});
