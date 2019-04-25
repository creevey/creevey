import { Tests, Test } from "./CreeveyContext";

function getTestsByPath(tests: Tests, path: string[]): Tests | Test {
  return path.reduce((subTests: Tests | Test, pathToken) => {
    if ("children" in subTests) {
      return subTests.children[pathToken];
    }
    return subTests;
  }, tests);
}

function checkTests(tests: Tests | Test, checked: boolean): Tests | Test {
  if ("children" in tests) {
    return {
      path: tests.path,
      checked,
      indeterminate: false,
      children: Object.entries(tests.children).reduce(
        (children, [title, child]) => ({ ...children, [title]: checkTests(child, checked) }),
        {}
      )
    };
  } else {
    return { ...tests, checked };
  }
}

function updateTest(tests: Tests): Tests {
  const children = Object.values(tests.children);
  const checkedEvery = children.every(test => test.checked);
  const checkedSome = children.some(test => test.checked);
  const indeterminate =
    children.some(test => ("indeterminate" in test ? test.indeterminate : false)) || (!checkedEvery && checkedSome);
  const checked = indeterminate || tests.checked == checkedEvery ? tests.checked : checkedEvery;
  return { ...tests, checked, indeterminate };
}

export function toogleChecked(tests: Tests, path: string[], checked: boolean): Tests {
  const checkedTests = checkTests(getTestsByPath(tests, path), checked);
  const rootTests = path
    .slice(0, -1)
    .map((_, index, tokens) => tokens.slice(0, tokens.length - index))
    .reduce((subTests, parentPath) => {
      const parentTests = getTestsByPath(tests, parentPath);
      if ("children" in parentTests) {
        const lastToken = path.slice(parentPath.length)[0];
        return updateTest({ ...parentTests, children: { ...parentTests.children, [lastToken]: subTests } });
      }
      return subTests;
    }, checkedTests);

  return updateTest({ ...tests, children: { ...tests.children, [path[0]]: rootTests } });
}
