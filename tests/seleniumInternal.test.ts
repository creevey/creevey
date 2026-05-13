import { describe, expect, test, vi, beforeEach } from 'vitest';

const addPreloadScript = vi.fn();

vi.mock('selenium-webdriver/bidi/scriptManager.js', () => ({
  default: vi.fn().mockResolvedValue({
    addPreloadScript,
  }),
}));

import {
  buildSeleniumCapabilities,
  installStorybookInitScript,
  STORYBOOK_INIT_SCRIPT,
} from '../src/server/selenium/internal.js';

describe('selenium Storybook init support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('enables BiDi for supported Selenium browsers', () => {
    const capabilities = buildSeleniumCapabilities('firefox', { platformName: 'linux' });

    expect(capabilities.get('browserName')).toBe('firefox');
    expect(capabilities.get('platformName')).toBe('linux');
    expect(capabilities.get('webSocketUrl')).toBe(true);
  });

  test('does not force BiDi for unsupported Selenium browsers', () => {
    const capabilities = buildSeleniumCapabilities('IE', { browserVersion: '11.0' });

    expect(capabilities.get('browserName')).toBe('IE');
    expect(capabilities.get('browserVersion')).toBe('11.0');
    expect(capabilities.get('webSocketUrl')).toBeUndefined();
  });

  test('installs the Storybook preload script through BiDi when available', async () => {
    const driver = {
      getCapabilities: vi.fn().mockResolvedValue({
        get: (key: string) => (key === 'webSocketUrl' ? 'ws://grid.example.test/session' : undefined),
      }),
      createCDPConnection: vi.fn(),
    };

    const result = await installStorybookInitScript(driver as never);

    expect(result).toBe('bidi');
    expect(addPreloadScript).toHaveBeenCalledTimes(1);
    expect(addPreloadScript.mock.calls[0]?.[0]).toEqual(expect.any(Function));
    expect(driver.createCDPConnection).not.toHaveBeenCalled();
  });

  test('falls back to CDP when BiDi is unavailable', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const driver = {
      getCapabilities: vi.fn().mockResolvedValue({
        get: () => undefined,
      }),
      createCDPConnection: vi.fn().mockResolvedValue({ execute }),
    };

    const result = await installStorybookInitScript(driver as never);

    expect(result).toBe('cdp');
    expect(driver.createCDPConnection).toHaveBeenCalledWith('page');
    expect(execute).toHaveBeenCalledWith(
      'Page.addScriptToEvaluateOnNewDocument',
      { source: STORYBOOK_INIT_SCRIPT },
      null,
    );
  });
});
