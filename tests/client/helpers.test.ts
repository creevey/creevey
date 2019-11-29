import { describe, it } from 'mocha';
import { expect } from 'chai';
import { toggleChecked } from '../../src/client/helpers';
import { CreeveySuite, Test } from '../../src/types';

function mockTest(): Test {
  return {
    id: '',
    path: [],
    retries: 0,
    skip: false,
  };
}

describe('toogleChecked', () => {
  it('should uncheck test', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      checked: true,
      indeterminate: false,
      children: { foo: { ...mockTest(), checked: true } },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      checked: false,
      indeterminate: false,
      children: { foo: { ...mockTest(), checked: false } },
    };
    const actualTests = toggleChecked(tests, ['foo'], false);

    expect(actualTests).to.deep.equal(expectedTests);
  });

  it('should uncheck suite', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      checked: true,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          checked: true,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: true } },
        },
      },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      checked: false,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          checked: false,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: false } },
        },
      },
    };
    const actualTests = toggleChecked(tests, ['foo'], false);

    expect(actualTests).to.deep.equal(expectedTests);
  });

  it('should set indeterminate on uncheck test', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      checked: true,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          checked: true,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: true }, baz: { ...mockTest(), checked: true } },
        },
      },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      checked: true,
      indeterminate: true,
      children: {
        foo: {
          path: [],
          skip: false,
          checked: true,
          indeterminate: true,
          children: { bar: { ...mockTest(), checked: false }, baz: { ...mockTest(), checked: true } },
        },
      },
    };
    const actualTests = toggleChecked(tests, ['foo', 'bar'], false);

    expect(actualTests).to.deep.equal(expectedTests);
  });

  it('should reset indeterminate on check test', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      checked: false,
      indeterminate: true,
      children: {
        foo: {
          path: [],
          skip: false,
          checked: false,
          indeterminate: true,
          children: { bar: { ...mockTest(), checked: false }, baz: { ...mockTest(), checked: true } },
        },
      },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      checked: true,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          checked: true,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: true }, baz: { ...mockTest(), checked: true } },
        },
      },
    };
    const actualTests = toggleChecked(tests, ['foo', 'bar'], true);

    expect(actualTests).to.deep.equal(expectedTests);
  });

  it('should set indeterminate on uncheck suite', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      checked: true,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          checked: true,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: true } },
        },
        bar: {
          path: [],
          skip: false,
          checked: true,
          indeterminate: false,
          children: { foo: { ...mockTest(), checked: true } },
        },
      },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      checked: true,
      indeterminate: true,
      children: {
        foo: {
          path: [],
          skip: false,
          checked: false,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: false } },
        },
        bar: {
          path: [],
          skip: false,
          checked: true,
          indeterminate: false,
          children: { foo: { ...mockTest(), checked: true } },
        },
      },
    };
    const actualTests = toggleChecked(tests, ['foo'], false);

    expect(actualTests).to.deep.equal(expectedTests);
  });

  it('should reset indeterminate on uncheck suite', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      checked: true,
      indeterminate: true,
      children: {
        foo: {
          path: [],
          skip: false,
          checked: false,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: false } },
        },
        bar: {
          path: [],
          skip: false,
          checked: true,
          indeterminate: false,
          children: { foo: { ...mockTest(), checked: true } },
        },
      },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      checked: false,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          checked: false,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: false } },
        },
        bar: {
          path: [],
          skip: false,
          checked: false,
          indeterminate: false,
          children: { foo: { ...mockTest(), checked: false } },
        },
      },
    };
    const actualTests = toggleChecked(tests, ['bar'], false);

    expect(actualTests).to.deep.equal(expectedTests);
  });

  it('should check root suite', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      checked: false,
      indeterminate: false,
      children: { foo: { ...mockTest(), checked: false } },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      checked: true,
      indeterminate: false,
      children: { foo: { ...mockTest(), checked: true } },
    };

    const actualTests = toggleChecked(tests, [], true);

    expect(actualTests).to.deep.equal(expectedTests);
  });
});
