import { describe, expect, test } from 'vitest';

import {
  PLAYWRIGHT_STORYBOOK_EVALUATE_SHIM_SCRIPT,
  PLAYWRIGHT_STORYBOOK_INIT_SCRIPT,
} from '../src/server/playwright/internal.js';

describe('playwright Storybook init support', () => {
  test('does not inject the __name shim temporarily', () => {
    expect(PLAYWRIGHT_STORYBOOK_INIT_SCRIPT).not.toContain('__name');
  });

  test('keeps Storybook readiness polling in the init script', () => {
    expect(PLAYWRIGHT_STORYBOOK_INIT_SCRIPT).toContain('requestAnimationFrame(check);');
    expect(PLAYWRIGHT_STORYBOOK_INIT_SCRIPT).toContain('window.__CREEVYE_STORYBOOK_READY__ = true');
  });

  test('provides a dedicated __name shim before serialized story helpers run', () => {
    expect(PLAYWRIGHT_STORYBOOK_EVALUATE_SHIM_SCRIPT).toContain('window.__name = defineName;');
    expect(PLAYWRIGHT_STORYBOOK_EVALUATE_SHIM_SCRIPT).toContain('globalThis.__name = defineName;');
  });
});
