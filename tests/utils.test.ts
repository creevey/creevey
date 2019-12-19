import { describe, it } from 'mocha';
import { expect } from 'chai';
import { shouldSkip } from '../src/utils';

describe('shouldSkip', () => {
  describe('kinds', () => {
    it('match story by array of kinds', () => {
      const result = shouldSkip({ id: 'id', kind: 'Button', name: 'with Error' }, 'chrome', {
        kinds: ['Button'],
        reason: 'Skip all buttons',
      });

      expect(result).to.equal('Skip all buttons');
    });
    it('skip story by array of kinds', () => {
      const result = shouldSkip({ id: 'id', kind: 'Input', name: 'with Error' }, 'chrome', {
        kinds: ['Button'],
        reason: 'Skip all buttons',
      });

      expect(result).to.equal(false);
    });
  });
});
