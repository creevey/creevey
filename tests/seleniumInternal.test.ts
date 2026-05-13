import { describe, expect, test, vi, beforeEach } from 'vitest';

import { buildSeleniumCapabilities, SELENIUM_STORYBOOK_EVALUATE_SHIM_SCRIPT } from '../src/server/selenium/internal.js';

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

  test('provides a dedicated __name shim for serialized story helpers', () => {
    expect(SELENIUM_STORYBOOK_EVALUATE_SHIM_SCRIPT).toContain('window.__name = defineName;');
    expect(SELENIUM_STORYBOOK_EVALUATE_SHIM_SCRIPT).toContain('globalThis.__name = defineName;');
  });
});
