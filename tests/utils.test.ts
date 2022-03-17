import { describe, it } from 'mocha';
import { expect } from 'chai';
import { shouldSkip } from '../src/server/utils';

describe('shouldSkip', () => {
  describe('browsers', () => {
    it('match story by browser', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Button', story: 'with Error' },
        {
          'Skip stories for chrome': {
            in: 'chrome',
          },
        },
      );

      expect(result).to.equal('Skip stories for chrome');
    });
    it('skip story by browser', () => {
      const result = shouldSkip(
        'firefox',
        { kind: 'Input', story: 'with Error' },
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
    it('match story by kind', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Button', story: 'with Error' },
        {
          'Skip all buttons': {
            kinds: 'Button',
          },
        },
      );

      expect(result).to.equal('Skip all buttons');
    });
    it('skip story by kind', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Input', story: 'with Error' },
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
    it('match story by story', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Button', story: 'with Error' },
        {
          'Skip `with Error` stories': {
            stories: 'with Error',
          },
        },
      );

      expect(result).to.equal('Skip `with Error` stories');
    });
    it('skip story by story', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Input', story: 'without Error' },
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
    it('match story by test', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Button', story: 'with Error' },
        {
          'Skip click tests': {
            tests: 'click',
          },
        },
        'click',
      );

      expect(result).to.equal('Skip click tests');
    });
    it('skip story by test', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Input', story: 'with Error' },
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
    it('match story by regex', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Button', story: 'with Error' },
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
    it('match story by array', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Button', story: 'with Error' },
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
    it('plain object without reason', () => {
      const result = shouldSkip('chrome', { kind: 'Button', story: 'with Error' }, { tests: 'click' }, 'click');

      expect(result).to.equal(true);
    });
    it('plain object with reason', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Button', story: 'with Error' },
        { tests: 'click', reason: 'Skip click tests' },
        'click',
      );

      expect(result).to.equal('Skip click tests');
    });
    it('object with arrays', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Button', story: 'with Error' },
        {
          Stories: [
            { tests: 'click', reason: 'Skip click tests' },
            { tests: 'fillIn', reason: 'Skip fillIn tests' },
          ],
        },
        'click',
      );

      expect(result).to.equal('Skip click tests');
    });
    it('object with objects', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Button', story: 'with Error' },
        {
          Button: { tests: 'click', reason: 'Skip click tests' },
          Input: { tests: 'fillIn', reason: 'Skip fillIn tests' },
        },
        'click',
      );

      expect(result).to.equal('Skip click tests');
    });
  });
});
