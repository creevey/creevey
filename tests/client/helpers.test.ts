import { expect, describe, test } from 'vitest';
import { checkSuite, isSuiteApproved } from '../../src/client/shared/helpers.js';
import { CreeveySuite, TestData } from '../../src/types.js';

function mockTest(): TestData {
  return {
    id: '',
    storyId: '',
    browser: '',
    storyPath: [],
    skip: false,
  };
}

describe('isSuiteApproved', () => {
  test('simple', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: true,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          opened: false,
          checked: true,
          indeterminate: false,
          children: { bar: { ...mockTest(), browser: 'chrome', checked: false, approved: { chrome: 1 } } },
        },
      },
    };
    expect(isSuiteApproved(tests)).toBeTruthy();
  });
  test('two tests, one approved', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: true,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          opened: false,
          checked: true,
          indeterminate: false,
          children: {
            chrome: { ...mockTest(), browser: 'chrome', checked: false, approved: { chrome: 1 } },
            ie: { ...mockTest(), browser: 'ie', checked: false },
          },
        },
      },
    };
    expect(isSuiteApproved(tests)).toBeFalsy();
  });
  test('two tests, all approved', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: true,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          opened: false,
          checked: true,
          indeterminate: false,
          children: {
            bar: { ...mockTest(), browser: 'chrome', checked: false, approved: { chrome: 1 } },
            baz: { ...mockTest(), browser: 'chrome', checked: false, approved: { chrome: 1 } },
          },
        },
      },
    };
    expect(isSuiteApproved(tests)).toBeTruthy();
  });
});

describe('toogleChecked', () => {
  test('should uncheck test', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: true,
      indeterminate: false,
      children: { foo: { ...mockTest(), checked: true } },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: false,
      indeterminate: false,
      children: { foo: { ...mockTest(), checked: false } },
    };
    checkSuite(tests, ['foo'], false);

    expect(tests).to.deep.equal(expectedTests);
  });

  test('should uncheck suite', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: true,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          opened: false,
          checked: true,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: true } },
        },
      },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: false,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          opened: false,
          checked: false,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: false } },
        },
      },
    };
    checkSuite(tests, ['foo'], false);

    expect(tests).to.deep.equal(expectedTests);
  });

  test('should set indeterminate on uncheck test', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: true,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          opened: false,
          checked: true,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: true }, baz: { ...mockTest(), checked: true } },
        },
      },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: true,
      indeterminate: true,
      children: {
        foo: {
          path: [],
          skip: false,
          opened: false,
          checked: true,
          indeterminate: true,
          children: { bar: { ...mockTest(), checked: false }, baz: { ...mockTest(), checked: true } },
        },
      },
    };
    checkSuite(tests, ['foo', 'bar'], false);

    expect(tests).to.deep.equal(expectedTests);
  });

  test('should reset indeterminate on check test', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: false,
      indeterminate: true,
      children: {
        foo: {
          path: [],
          skip: false,
          opened: false,
          checked: false,
          indeterminate: true,
          children: { bar: { ...mockTest(), checked: false }, baz: { ...mockTest(), checked: true } },
        },
      },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: true,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          opened: false,
          checked: true,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: true }, baz: { ...mockTest(), checked: true } },
        },
      },
    };
    checkSuite(tests, ['foo', 'bar'], true);

    expect(tests).to.deep.equal(expectedTests);
  });

  test('should set indeterminate on uncheck suite', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: true,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          opened: false,
          checked: true,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: true } },
        },
        bar: {
          path: [],
          skip: false,
          opened: false,
          checked: true,
          indeterminate: false,
          children: { foo: { ...mockTest(), checked: true } },
        },
      },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: true,
      indeterminate: true,
      children: {
        foo: {
          path: [],
          skip: false,
          opened: false,
          checked: false,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: false } },
        },
        bar: {
          path: [],
          skip: false,
          opened: false,
          checked: true,
          indeterminate: false,
          children: { foo: { ...mockTest(), checked: true } },
        },
      },
    };
    checkSuite(tests, ['foo'], false);

    expect(tests).to.deep.equal(expectedTests);
  });

  test('should reset indeterminate on uncheck suite', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: true,
      indeterminate: true,
      children: {
        foo: {
          path: [],
          skip: false,
          opened: false,
          checked: false,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: false } },
        },
        bar: {
          path: [],
          skip: false,
          opened: false,
          checked: true,
          indeterminate: false,
          children: { foo: { ...mockTest(), checked: true } },
        },
      },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: false,
      indeterminate: false,
      children: {
        foo: {
          path: [],
          skip: false,
          opened: false,
          checked: false,
          indeterminate: false,
          children: { bar: { ...mockTest(), checked: false } },
        },
        bar: {
          path: [],
          skip: false,
          opened: false,
          checked: false,
          indeterminate: false,
          children: { foo: { ...mockTest(), checked: false } },
        },
      },
    };
    checkSuite(tests, ['bar'], false);

    expect(tests).to.deep.equal(expectedTests);
  });

  test('should check root suite', () => {
    const tests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: false,
      indeterminate: false,
      children: { foo: { ...mockTest(), checked: false } },
    };
    const expectedTests: CreeveySuite = {
      path: [],
      skip: false,
      opened: false,
      checked: true,
      indeterminate: false,
      children: { foo: { ...mockTest(), checked: true } },
    };

    checkSuite(tests, [], true);

    expect(tests).to.deep.equal(expectedTests);
  });
});
