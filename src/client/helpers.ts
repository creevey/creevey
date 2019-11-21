import { Suite, Test } from "./CreeveyContext";
import { Test as ApiTest, isTest, isDefined, TestStatus } from "../types";

export function getTestsByPath(tests: Suite, path: string[]): Suite | Test {
  return path.reduce(
    (subTests: Suite | Test, pathToken) => (isTest(subTests) ? subTests : subTests.children[pathToken]),
    tests
  );
}

function checkTests(tests: Suite | Test, checked: boolean): Suite | Test {
  if (isTest(tests)) {
    return { ...tests, checked };
  }
  return {
    ...tests,
    checked,
    indeterminate: false,
    children: Object.entries(tests.children).reduce(
      (children, [title, child]) => ({ ...children, [title]: checkTests(child, checked) }),
      {}
    )
  };
}

function updateChecked(tests: Suite): Suite {
  const children = Object.values(tests.children);
  const checkedEvery = children.every(test => test.checked);
  const checkedSome = children.some(test => test.checked);
  const indeterminate =
    children.some(test => (isTest(test) ? false : test.indeterminate)) || (!checkedEvery && checkedSome);
  const checked = indeterminate || tests.checked == checkedEvery ? tests.checked : checkedEvery;
  return { ...tests, checked, indeterminate };
}

export function toogleChecked(tests: Suite, path: string[], checked: boolean): Suite {
  const checkedTests = checkTests(getTestsByPath(tests, path), checked);
  if (path.length == 0 && !isTest(checkedTests)) {
    return checkedTests;
  }
  const rootTests = path
    .slice(0, -1)
    .map((_, index, tokens) => tokens.slice(0, tokens.length - index))
    .reduce((subTests, parentPath) => {
      const parentTests = getTestsByPath(tests, parentPath);
      if (isTest(parentTests)) {
        return subTests;
      }
      const lastToken = path.slice(parentPath.length)[0];
      return updateChecked({ ...parentTests, children: { ...parentTests.children, [lastToken]: subTests } });
    }, checkedTests);

  return updateChecked({ ...tests, children: { ...tests.children, [path[0]]: rootTests } });
}

export function treeifyTests(testsById: { [id: string]: ApiTest | undefined }): Suite {
  function makeEmptySuiteNode(path: string[] = []): Suite {
    return {
      path,
      skip: true,
      checked: true,
      indeterminate: false,
      children: {}
    };
  }
  const rootSuite: Suite = makeEmptySuiteNode();
  Object.values(testsById).forEach(test => {
    if (!test) return;

    const [browser, ...suitePath] = test.path;
    const lastSuite = suitePath.reverse().reduce((suite, token) => {
      const subSuite = suite.children[token] || makeEmptySuiteNode([...suite.path, token]);
      if (!test.skip) subSuite.skip = false;
      subSuite.status = calcStatus(subSuite.status, test.status);
      if (!subSuite.skip) suite.skip = false;
      suite.children[token] = subSuite;
      suite.status = calcStatus(suite.status, subSuite.status);
      if (isTest(subSuite)) {
        throw new Error(`Suite and Test should not have same path '${JSON.stringify(subSuite.path)}'`);
      }
      return subSuite;
    }, rootSuite);
    test.path.reverse();
    lastSuite.children[browser] = { ...test, checked: true };
  });

  return rootSuite;
}

export function getCheckedTests(tests: Suite | Test): Test[] {
  if (isTest(tests)) {
    return tests.checked ? [tests] : [];
  }
  if (!tests.checked && !tests.indeterminate) {
    return [];
  }
  return Object.values(tests.children).reduce(
    (checkedTests: Test[], subTests) => [...checkedTests, ...getCheckedTests(subTests)],
    []
  );
}

export function updateTestStatus(tests: Suite, path: string[], update: Partial<ApiTest>): Suite {
  const [title, ...restPath] = path;
  const subTests = tests.children[title];
  const newTests = { ...tests, children: { ...tests.children } };
  if (isTest(subTests)) {
    const test = { ...subTests };
    const { status, results, approved } = update;
    if (isDefined(status)) test.status = status;
    if (isDefined(results)) test.results = [...(test.results || []), ...results];
    if (isDefined(approved)) test.approved = { ...(test.approved || {}), ...approved };
    newTests.children[title] = test;
  } else {
    newTests.children[title] = updateTestStatus(subTests, restPath, update);
  }
  newTests.status = Object.values(newTests.children)
    .map(({ status }) => status)
    .reduce(calcStatus);

  return newTests;
}

function calcStatus(oldStatus?: TestStatus, newStatus?: TestStatus): TestStatus | undefined {
  if (
    !oldStatus ||
    (oldStatus == "success" && newStatus != "success") ||
    (oldStatus == "failed" && newStatus != "failed" && newStatus != "success") ||
    (oldStatus == "pending" && newStatus != "pending" && newStatus != "failed" && newStatus != "success")
  )
    return newStatus || oldStatus;
  return oldStatus;
}
