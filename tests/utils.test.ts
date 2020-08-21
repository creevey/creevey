import { describe, it } from 'mocha';
import { expect } from 'chai';
import { shouldSkip } from '../src/server/utils';

describe('shouldSkip', () => {
  describe('kinds', () => {
    it('match story by array of kinds', () => {
      const result = shouldSkip(
        { browser: 'chrome', kind: 'Button', story: 'with Error' },
        {
          kinds: ['Button'],
          reason: 'Skip all buttons',
        },
      );

      expect(result).to.equal('Skip all buttons');
    });
    it('skip story by array of kinds', () => {
      const result = shouldSkip(
        { browser: 'chrome', kind: 'Input', story: 'with Error' },
        {
          kinds: ['Button'],
          reason: 'Skip all buttons',
        },
      );

      expect(result).to.equal(false);
    });
  });
});
