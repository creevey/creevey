import { describe, expect, test } from 'vitest';
import { error } from 'selenium-webdriver';

import { isSessionDeadError } from '../src/server/selenium/internal.js';

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
