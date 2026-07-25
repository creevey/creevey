import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { error } from 'selenium-webdriver';
import type { Config } from '../src/types.js';

import { isSessionDeadError, InternalBrowser } from '../src/server/selenium/internal.js';
import { SeleniumWebdriver } from '../src/server/selenium/webdriver.js';

// Mock ./internal.js so InternalBrowser.getBrowser returns fakes we control,
// while keeping the REAL isSessionDeadError (re-exported via importActual).
const getBrowserMock = vi.hoisted(() => vi.fn());
vi.mock('../src/server/selenium/internal.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/server/selenium/internal.js')>();
  return { ...actual, InternalBrowser: { getBrowser: getBrowserMock } };
});

const { NoSuchSessionError } = error;

describe('isSessionDeadError', () => {
  test('matches a real NoSuchSessionError instance', () => {
    expect(isSessionDeadError(new NoSuchSessionError('session not found'))).toBe(true);
  });

  test('matches by error.name when the class is lost (vendored/wrapped)', () => {
    const e = new Error('session does not exist');
    e.name = 'NoSuchSessionError';
    expect(isSessionDeadError(e)).toBe(true);
  });

  test.each([
    'no such session',
    'session not found',
    'Session does not exist',
    'Session timed out or not found',
    'invalid session id',
  ])('matches by W3C substring: %s', (message) => {
    expect(isSessionDeadError(new Error(message))).toBe(true);
  });

  test.each([
    'timeout of 60000ms exceeded',
    'ECONNRESET socket disconnected',
    'no such element',
    'element click intercepted',
    'unexpected token < in JSON',
  ])('does NOT match unrelated errors: %s', (message) => {
    expect(isSessionDeadError(new Error(message))).toBe(false);
  });

  test('does not treat a generic timeout as session death via substring', () => {
    // A bare 'timeout' must NOT be classified as session-dead by the substring path:
    // timeouts already have dedicated handling (worker -> subtype:'unknown').
    expect(isSessionDeadError(new Error('Request timed out'))).toBe(false);
  });

  test('a genuine NoSuchSessionError wins even if its message contains timeout', () => {
    expect(isSessionDeadError(new NoSuchSessionError('session timed out or not found'))).toBe(true);
  });

  test('handles non-Error inputs', () => {
    expect(isSessionDeadError(undefined)).toBe(false);
    expect(isSessionDeadError(null)).toBe(false);
    expect(isSessionDeadError('session not found')).toBe(false);
    expect(isSessionDeadError({ name: 'NoSuchSessionError' })).toBe(true);
    expect(isSessionDeadError({ message: 'no such session' })).toBe(true);
  });
});

const fakeConfig = {} as unknown as Config;

// A loose stand-in for InternalBrowser. We cast internally so call sites stay clean;
// the real class is replaced by the vi.mock above, so structural typing is enough.
function makeFakeInternalBrowser(opts: { getTitle: () => Promise<string>; sessionId?: string }): InternalBrowser {
  return {
    browser: {
      getTitle: opts.getTitle,
      getSession: () => Promise.resolve({ getId: () => opts.sessionId ?? 'session-1' }),
    },
    closeBrowser: vi.fn(),
  } as unknown as InternalBrowser;
}

describe('SeleniumWebdriver.ensureBrowser', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    getBrowserMock.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('skips the probe when the session was used recently (activity gate)', async () => {
    const getTitle = vi.fn().mockResolvedValue('https://storybook/iframe.html');
    getBrowserMock.mockResolvedValueOnce(makeFakeInternalBrowser({ getTitle }));

    const driver = new SeleniumWebdriver('chrome', 'http://grid:4444', fakeConfig, false);
    await driver.openBrowser();

    // Only 1 second after open — well within the 30s gate.
    vi.setSystemTime(new Date('2026-01-01T00:00:01Z'));
    const recreated = await driver.ensureBrowser();

    expect(recreated).toBe(false);
    expect(getTitle).not.toHaveBeenCalled();
  });

  test('recreates the session in-process after a session-dead probe', async () => {
    const deadTitle = vi.fn().mockRejectedValueOnce(new NoSuchSessionError('session not found'));
    const deadBrowser = makeFakeInternalBrowser({ getTitle: deadTitle, sessionId: 'old' });

    const liveTitle = vi.fn().mockResolvedValue('https://storybook/iframe.html');
    const liveBrowser = makeFakeInternalBrowser({ getTitle: liveTitle, sessionId: 'new' });

    getBrowserMock
      .mockResolvedValueOnce(deadBrowser) // initial openBrowser
      .mockResolvedValueOnce(liveBrowser); // recreate via openBrowser(true)

    const driver = new SeleniumWebdriver('chrome', 'http://grid:4444', fakeConfig, false);
    await driver.openBrowser();

    // Advance past the 30s gate so the probe runs.
    vi.setSystemTime(new Date('2026-01-01T00:00:31Z'));
    const recreated = await driver.ensureBrowser();

    expect(recreated).toBe(true);
    expect(deadTitle).toHaveBeenCalledTimes(1);
    expect(getBrowserMock).toHaveBeenCalledTimes(2);
    // Session id now reflects the recreated session.
    expect(await driver.getSessionId()).toBe('new');
  });

  test('does not recreate on a non-session-dead probe error (rethrows as normal test error)', async () => {
    const getTitle = vi.fn().mockRejectedValueOnce(new Error('element click intercepted'));
    getBrowserMock.mockResolvedValueOnce(makeFakeInternalBrowser({ getTitle }));

    const driver = new SeleniumWebdriver('chrome', 'http://grid:4444', fakeConfig, false);
    await driver.openBrowser();

    vi.setSystemTime(new Date('2026-01-01T00:00:31Z'));
    await expect(driver.ensureBrowser()).rejects.toThrow('element click intercepted');
    expect(getBrowserMock).toHaveBeenCalledTimes(1); // no recreate
  });

  test('escalates (throws) when recreate itself fails (grid refused a new session)', async () => {
    const deadTitle = vi.fn().mockRejectedValueOnce(new NoSuchSessionError('session not found'));
    getBrowserMock
      .mockResolvedValueOnce(makeFakeInternalBrowser({ getTitle: deadTitle })) // initial
      .mockResolvedValueOnce(null); // recreate returns null -> grid refused

    const driver = new SeleniumWebdriver('chrome', 'http://grid:4444', fakeConfig, false);
    await driver.openBrowser();

    vi.setSystemTime(new Date('2026-01-01T00:00:31Z'));
    await expect(driver.ensureBrowser()).rejects.toThrow(/Failed to recreate session/);
  });

  test('does nothing when no browser is open', async () => {
    const driver = new SeleniumWebdriver('chrome', 'http://grid:4444', fakeConfig, false);
    vi.setSystemTime(new Date('2026-01-01T00:00:31Z'));
    expect(await driver.ensureBrowser()).toBe(false);
  });
});
