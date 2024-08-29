import { expect, describe, test } from 'vitest';
import { shouldSkip } from '../src/server/utils.js';

describe('shouldSkip', () => {
  describe('browsers', () => {
    test('match story by browser', () => {
      const result = shouldSkip(
        'chrome',
        { title: 'Button', name: 'with Error' },
        {
          'Skip stories for chrome': {
            in: 'chrome',
          },
        },
      );

      expect(result).to.equal('Skip stories for chrome');
    });
    test('skip story by browser', () => {
      const result = shouldSkip(
        'firefox',
        { title: 'Input', name: 'with Error' },
        {
          'Skip stories for chrome': {
            in: 'chrome',
          },
        },
      );

      expect(result).to.equal(false);
    });
  });
  describe('kinds', () => {
    test('match story by kind', () => {
      const result = shouldSkip(
        'chrome',
        { title: 'Button', name: 'with Error' },
        {
          'Skip all buttons': {
            kinds: 'Button',
          },
        },
      );

      expect(result).to.equal('Skip all buttons');
    });
    test('skip story by kind', () => {
      const result = shouldSkip(
        'chrome',
        { title: 'Input', name: 'with Error' },
        {
          'Skip all buttons': {
            kinds: 'Button',
          },
        },
      );

      expect(result).to.equal(false);
    });
  });
  describe('stories', () => {
    test('match story by story', () => {
      const result = shouldSkip(
        'chrome',
        { title: 'Button', name: 'with Error' },
        {
          'Skip `with Error` stories': {
            stories: 'with Error',
          },
        },
      );

      expect(result).to.equal('Skip `with Error` stories');
    });
    test('skip story by story', () => {
      const result = shouldSkip(
        'chrome',
        { title: 'Input', name: 'without Error' },
        {
          'Skip `with Error` stories': {
            stories: 'with Error',
          },
        },
      );

      expect(result).to.equal(false);
    });
  });
  describe('tests', () => {
    test('match story by test', () => {
      const result = shouldSkip(
        'chrome',
        { title: 'Button', name: 'with Error' },
        {
          'Skip click tests': {
            tests: 'click',
          },
        },
        'click',
      );

      expect(result).to.equal('Skip click tests');
    });
    test('skip story by test', () => {
      const result = shouldSkip(
        'chrome',
        { title: 'Input', name: 'with Error' },
        {
          'Skip click tests': {
            tests: 'click',
          },
        },
        'fillIn',
      );

      expect(result).to.equal(false);
    });
  });
  describe('regex', () => {
    test('match story by regex', () => {
      const result = shouldSkip(
        'chrome',
        { title: 'Button', name: 'with Error' },
        {
          'Skip stories started with `with`': {
            stories: /^with/g,
          },
        },
        'click',
      );

      expect(result).to.equal('Skip stories started with `with`');
    });
  });
  describe('array', () => {
    test('match story by array', () => {
      const result = shouldSkip(
        'chrome',
        { title: 'Button', name: 'with Error' },
        {
          'Skip some stories': {
            stories: ['Primary', 'with Error'],
          },
        },
        'click',
      );

      expect(result).to.equal('Skip some stories');
    });
  });
  describe('object', () => {
    test('plain object', () => {
      const result = shouldSkip(
        'chrome',
        { title: 'Button', name: 'with Error' },
        { 'Skip click tests': { tests: 'click' } },
        'click',
      );

      expect(result).to.equal('Skip click tests');
    });
    test('object with arrays', () => {
      const result = shouldSkip(
        'chrome',
        { title: 'Button', name: 'with Error' },
        {
          'Skip click tests': [{ tests: 'click' }, { tests: 'fillIn' }],
        },
        'click',
      );

      expect(result).to.equal('Skip click tests');
    });
    test('object with objects', () => {
      const result = shouldSkip(
        'chrome',
        { title: 'Button', name: 'with Error' },
        {
          'Skip click tests': { tests: 'click' },
          'Skip fillIn tests': { tests: 'fillIn' },
        },
        'click',
      );

      expect(result).to.equal('Skip click tests');
    });
  });
});
