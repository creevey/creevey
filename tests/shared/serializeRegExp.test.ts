import { expect } from 'chai';
import { serializeRegExp, deserializeRegExp, SerializedRegExp } from '../../src/shared/serializeRegExp.js';

describe('serialize regexp', () => {
  it('serializes correctly', () => {
    const regexp = /[a-z]/gi;
    const serialized: SerializedRegExp = {
      __regexp: true,
      source: '[a-z]',
      flags: 'gi',
    };
    expect(serializeRegExp(regexp)).to.deep.equal(serialized);
  });

  it('deserializes correctly', () => {
    const regexp = /[a-z]/gi;
    const serialized: SerializedRegExp = {
      __regexp: true,
      source: '[a-z]',
      flags: 'gi',
    };
    expect(deserializeRegExp(serialized)).to.deep.equal(regexp);
  });
});
