import { parse, stringify } from 'qs';
import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TestData, isTest, isDefined, TestStatus, CreeveySuite, CreeveyTest, CreeveyStatus } from '../../types.js';

export interface CreeveyViewFilter {
  status: TestStatus | null;
  subStrings: string[];
}

export interface CreeveyTestsStatus {
  successCount: number;
  failedCount: number;
  pendingCount: number;
  approvedCount: number;
}

const statusUpdatesMap = new Map<TestStatus | undefined, RegExp>([
  [undefined, /(unknown|success|approved|failed|pending|running)/],
  ['unknown', /(success|approved|failed|pending|running)/],
  ['success', /(approved|failed|pending|running)/],
  ['approved', /(failed|pending|running)/],
  ['failed', /(pending|running)/],
  ['pending', /running/],
]);

function makeEmptySuiteNode(path: string[] = []): CreeveySuite {
  return {
    path,
    skip: true,
    opened: false,
    checked: true,
    indeterminate: false,
    children: {},
  };
}

export function calcStatus(oldStatus?: TestStatus, newStatus?: TestStatus): TestStatus | undefined {
  return newStatus && statusUpdatesMap.get(oldStatus)?.test(newStatus) ? newStatus : oldStatus;
}

export function getTestPath(test: Pick<TestData, 'browser' | 'testName' | 'storyPath'>): string[] {
  const { browser, testName, storyPath } = test;
  return [...storyPath, testName, browser].filter(isDefined);
}

export function getSuiteByPath(suite: CreeveySuite, path: string[]): CreeveySuite | CreeveyTest | undefined {
  return path.reduce(
    (suiteOrTest: CreeveySuite | CreeveyTest | undefined, pathToken) =>
      isTest(suiteOrTest) ? suiteOrTest : suiteOrTest?.children[pathToken],
    suite,
  );
}

export function getTestByPath(suite: CreeveySuite, path: string[]): CreeveyTest | null {
  const test = getSuiteByPath(suite, path) ?? suite;
  return isTest(test) ? test : null;
}

export function getTestsByStoryId(suite: CreeveySuite, storyId: string): CreeveyTest[] {
  return Object.values(suite.children)
    .filter(isDefined)
    .flatMap((suiteOrTest) => {
      if (isTest(suiteOrTest)) return suiteOrTest.storyId === storyId ? suiteOrTest : [];

      return getTestsByStoryId(suiteOrTest, storyId);
    })
    .filter(isDefined);
}

function checkTests(suiteOrTest: CreeveySuite | CreeveyTest, checked: boolean): void {
  suiteOrTest.checked = checked;
  if (!isTest(suiteOrTest)) {
    suiteOrTest.indeterminate = false;
    Object.values(suiteOrTest.children)
      .filter(isDefined)
      .forEach((child) => {
        checkTests(child, checked);
      });
  }
}

function updateChecked(suite: CreeveySuite): void {
  const children = Object.values(suite.children)
    .filter(isDefined)
    .filter((child) => !child.skip);
  const checkedEvery = children.every((test) => test.checked);
  const checkedSome = children.some((test) => test.checked);
  const indeterminate =
    children.some((test) => (isTest(test) ? false : test.indeterminate)) || (!checkedEvery && checkedSome);
  const checked = indeterminate || suite.checked == checkedEvery ? suite.checked : checkedEvery;

  suite.checked = checked;
  suite.indeterminate = indeterminate;
}

export function checkSuite(suite: CreeveySuite, path: string[], checked: boolean): void {
  const subSuite = getSuiteByPath(suite, path);
  if (subSuite) checkTests(subSuite, checked);

  path
    .slice(0, -1)
    .map((_, index, tokens) => tokens.slice(0, tokens.length - index))
    .forEach((parentPath) => {
      const parentSuite = getSuiteByPath(suite, parentPath);
      if (isTest(parentSuite)) return;
      if (parentSuite) updateChecked(parentSuite);
    });

  updateChecked(suite);
}

export function treeifyTests(testsById: CreeveyStatus['tests']): CreeveySuite {
  const rootSuite: CreeveySuite = makeEmptySuiteNode();

  rootSuite.opened = true;
  Object.values(testsById).forEach((test) => {
    if (!test) return;

    const [browser, ...testPath] = getTestPath(test).reverse();

    const lastSuite = testPath.reverse().reduce((suite, token) => {
      const subSuite = suite.children[token] ?? makeEmptySuiteNode([...suite.path, token]);

      subSuite.status = calcStatus(subSuite.status, test.status);

      if (!test.skip) subSuite.skip = false;
      if (!subSuite.skip) suite.skip = false;

      suite.children[token] = subSuite;
      suite.status = calcStatus(suite.status, subSuite.status);

      if (isTest(subSuite)) {
        throw new Error(`Suite and Test should not have same path '${JSON.stringify(getTestPath(subSuite))}'`);
      }

      return subSuite;
    }, rootSuite);

    lastSuite.children[browser] = { ...test, checked: true };
  });

  return rootSuite;
}

export function getCheckedTests(suite: CreeveySuite): CreeveyTest[] {
  return Object.values(suite.children)
    .filter(isDefined)
    .flatMap((suiteOrTest) => {
      if (isTest(suiteOrTest)) return suiteOrTest.checked ? suiteOrTest : [];
      if (!suiteOrTest.checked && !suiteOrTest.indeterminate) return [];

      return getCheckedTests(suiteOrTest);
    });
}

export function getFailedTests(suite: CreeveySuite): CreeveyTest[] {
  return Object.values(suite.children)
    .filter(isDefined)
    .flatMap((suiteOrTest) => {
      if (isTest(suiteOrTest)) return suiteOrTest.status === 'failed' ? suiteOrTest : [];

      return getFailedTests(suiteOrTest);
    });
}

export function updateTestStatus(suite: CreeveySuite, path: string[], update: Partial<TestData>): void {
  const title = path.shift();

  if (!title) return;

  const suiteOrTest =
    suite.children[title] ??
    (suite.children[title] = {
      ...(path.length == 0 ? (update as TestData) : makeEmptySuiteNode([...suite.path, title])),
      checked: suite.checked,
    });
  if (isTest(suiteOrTest)) {
    const test = suiteOrTest;
    const { skip, status, results, approved } = update;
    if (isDefined(skip)) test.skip = skip;
    if (isDefined(status)) test.status = status;
    if (isDefined(results)) {
      if (test.results) test.results.push(...results);
      else test.results = results;
    }
    if (approved === null) test.approved = null;
    else if (approved !== undefined)
      Object.entries(approved).forEach(
        ([image, retry]) => retry !== undefined && ((test.approved = test.approved ?? {})[image] = retry),
      );
  } else {
    const subSuite = suiteOrTest;
    updateTestStatus(subSuite, path, update);
  }
  suite.skip = Object.values(suite.children)
    .filter(isDefined)
    .map(({ skip }) => skip)
    .every(Boolean);
  suite.status = Object.values(suite.children)
    .filter(isDefined)
    .map(({ status }) => status)
    .reduce(calcStatus);
}

export function removeTests(suite: CreeveySuite, path: string[]): void {
  const title = path.shift();

  if (!title) return;

  const suiteOrTest = suite.children[title];
  if (suiteOrTest && !isTest(suiteOrTest)) removeTests(suiteOrTest, path);
  if (isTest(suiteOrTest) || Object.keys(suiteOrTest?.children ?? {}).length == 0) {
    // TODO Use Map instead
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete suite.children[title];
  }
  if (Object.keys(suite.children).length == 0) return;
  updateChecked(suite);
  suite.skip = Object.values(suite.children)
    .filter(isDefined)
    .map(({ skip }) => skip)
    .every(Boolean);
  suite.status = Object.values(suite.children)
    .filter(isDefined)
    .map(({ status }) => status)
    .reduce(calcStatus);
}

// TODO Include images to test suite
// TODO If only one image in test, don't include it
export function filterTests(suite: CreeveySuite, filter: CreeveyViewFilter): CreeveySuite {
  const { status, subStrings } = filter;
  if (!status && !subStrings.length) return suite;
  const filteredSuite: CreeveySuite = { ...suite, children: {} };

  Object.entries(suite.children).forEach(([title, suiteOrTest]) => {
    if (!suiteOrTest || suiteOrTest.skip) return;
    if (!status && subStrings.some((subString) => title.toLowerCase().includes(subString))) {
      filteredSuite.children[title] = suiteOrTest;
    } else if (isTest(suiteOrTest)) {
      if (status && suiteOrTest.status && ['pending', 'running', status].includes(suiteOrTest.status))
        filteredSuite.children[title] = suiteOrTest;
    } else {
      const filteredSubSuite = filterTests(suiteOrTest, filter);
      if (Object.keys(filteredSubSuite.children).length == 0) return;

      filteredSuite.children[title] = filteredSubSuite;
    }
  });

  return filteredSuite;
}

export function openSuite(suite: CreeveySuite, path: string[], opened: boolean): void {
  const subSuite = path.reduce((suiteOrTest: CreeveySuite | CreeveyTest | undefined, pathToken) => {
    if (suiteOrTest && !isTest(suiteOrTest)) {
      if (opened) suiteOrTest.opened = opened;
      return suiteOrTest.children[pathToken];
    }
  }, suite);
  if (subSuite && !isTest(subSuite)) subSuite.opened = opened;
}

export function flattenSuite(suite: CreeveySuite): { title: string; suite: CreeveySuite | CreeveyTest }[] {
  if (!suite.opened) return [];
  return Object.entries(suite.children).flatMap(([title, subSuite]) =>
    subSuite ? [{ title, suite: subSuite }, ...(isTest(subSuite) ? [] : flattenSuite(subSuite))] : [],
  );
}

export function countTestsStatus(suite: CreeveySuite): CreeveyTestsStatus {
  let successCount = 0;
  let failedCount = 0;
  let approvedCount = 0;
  let pendingCount = 0;

  const cases: (CreeveySuite | CreeveyTest)[] = Object.values(suite.children).filter(isDefined);
  let suiteOrTest;
  while ((suiteOrTest = cases.pop())) {
    if (isTest(suiteOrTest)) {
      if (suiteOrTest.status === 'approved') approvedCount++;
      if (suiteOrTest.status === 'success') successCount++;
      if (suiteOrTest.status === 'failed') failedCount++;
      if (suiteOrTest.status === 'pending') pendingCount++;
    } else {
      cases.push(...Object.values(suiteOrTest.children).filter(isDefined));
    }
  }

  return { approvedCount, successCount, failedCount, pendingCount };
}

export function getConnectionUrl(): string {
  return [
    typeof __CREEVEY_SERVER_HOST__ == 'undefined' ? window.location.hostname : __CREEVEY_SERVER_HOST__,
    typeof __CREEVEY_SERVER_PORT__ == 'undefined' ? window.location.port : __CREEVEY_SERVER_PORT__,
  ]
    .filter(Boolean)
    .join(':');
}

export function getImageUrl(path: string[], imageName: string): string {
  // path => [title, story, test, browser]
  const browser = path.slice(-1)[0];
  const imagesUrl = window.location.host
    ? `${window.location.protocol}//${getConnectionUrl()}${
        window.location.pathname == '/' ? '/report' : window.location.pathname.split('/').slice(0, -1).join('/')
      }/${encodeURI(path.slice(0, -1).join('/'))}`
    : encodeURI(path.slice(0, -1).join('/'));

  return imageName == browser ? imagesUrl : `${imagesUrl}/${encodeURI(browser)}`;
}

export function getBorderSize(element: HTMLElement): number {
  // NOTE Firefox returns empty string for `borderWidth` prop
  const borderSize = parseFloat(getComputedStyle(element).borderTopWidth);
  return Number.isNaN(borderSize) ? 0 : borderSize;
}

export function useLoadImages(s1: string, s2: string, s3: string): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    void Promise.all(
      [s1, s2, s3].map(
        (url) =>
          new Promise((resolve) => {
            const image = document.createElement('img');
            image.src = url;
            image.onload = resolve;
            image.onerror = resolve;
          }),
      ),
    ).then(() => {
      setLoaded(true);
    });
  }, [s1, s2, s3]);

  return loaded;
}

/**
 * Uses the ResizeObserver API to observe changes within the given HTML Element DOM Rect.
 *
 * @returns dimensions of element's content box (which means without paddings and border width)
 */
export function useResizeObserver<T extends Element>(
  elementRef: RefObject<T>,
  onResize: () => void,
  debounceTimeout = 16,
): void {
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    observerRef.current = new ResizeObserver(onResize);
    observerRef.current.observe(elementRef.current);

    return () => observerRef.current?.disconnect();
  }, [debounceTimeout, elementRef, onResize]);
}

export function useApplyScale(imageRef: RefObject<HTMLImageElement>, scale: number, dependency?: unknown): void {
  useLayoutEffect(() => {
    if (!imageRef.current) return;
    const image = imageRef.current;
    const borderSize = getBorderSize(image);
    image.style.height = `${image.naturalHeight * scale + borderSize * 2}px`;
  }, [imageRef, scale, dependency]);
}

export function useCalcScale(diffImageRef: RefObject<HTMLImageElement>, loaded: boolean): number {
  const [scale, setScale] = useState(1);

  const calcScale = useCallback(() => {
    const diffImage = diffImageRef.current;

    if (!diffImage || !loaded) {
      setScale(1);
      return;
    }
    const borderSize = getBorderSize(diffImage);
    const ratio = (diffImage.getBoundingClientRect().width - borderSize * 2) / diffImage.naturalWidth;
    setScale(Math.min(1, ratio));
  }, [diffImageRef, loaded]);

  useResizeObserver(diffImageRef, calcScale);
  useLayoutEffect(calcScale, [calcScale]);

  return scale;
}

export function setSearchParams(testPath: string[]): void {
  const pageUrl = `?${stringify({ testPath })}`;
  window.history.pushState({ testPath }, '', pageUrl);
}

export function getTestPathFromSearch(): string[] {
  const { testPath } = parse(window.location.search.slice(1));
  if (Array.isArray(testPath) && testPath.every((token) => typeof token == 'string')) {
    return testPath;
  }
  return [];
}

export function useForceUpdate(): () => void {
  const [, update] = useState({});

  return useCallback(() => {
    update({});
  }, []);
}
