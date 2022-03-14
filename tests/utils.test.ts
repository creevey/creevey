import { describe, it } from 'mocha';
import { expect } from 'chai';
import { shouldSkip } from '../src/server/utils';

// TODO Write tests
describe('shouldSkip', () => {
  describe('kinds', () => {
    it('match story by array of kinds', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Button', story: 'with Error' },
        {
          'Skip all buttons': {
            kinds: ['Button'],
          },
        },
      );

      expect(result).to.equal('Skip all buttons');
    });
    it('skip story by array of kinds', () => {
      const result = shouldSkip(
        'chrome',
        { kind: 'Input', story: 'with Error' },
        {
          'Skip all buttons': {
            kinds: ['Button'],
          },
        },
      );

      expect(result).to.equal(false);
    });
  });
});
