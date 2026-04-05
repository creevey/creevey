"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcStatus = calcStatus;
exports.getTestPath = getTestPath;
exports.getSuiteByPath = getSuiteByPath;
exports.getTestByPath = getTestByPath;
exports.getTestsByStoryId = getTestsByStoryId;
exports.checkSuite = checkSuite;
exports.treeifyTests = treeifyTests;
exports.getCheckedTests = getCheckedTests;
exports.getFailedTests = getFailedTests;
exports.updateTestStatus = updateTestStatus;
exports.removeTests = removeTests;
exports.filterTests = filterTests;
exports.openSuite = openSuite;
exports.flattenSuite = flattenSuite;
exports.countTestsStatus = countTestsStatus;
exports.getConnectionUrl = getConnectionUrl;
exports.getImageUrl = getImageUrl;
exports.getBorderSize = getBorderSize;
exports.useLoadImages = useLoadImages;
exports.useResizeObserver = useResizeObserver;
exports.useApplyScale = useApplyScale;
exports.useCalcScale = useCalcScale;
exports.setSearchParams = setSearchParams;
exports.getTestPathFromSearch = getTestPathFromSearch;
exports.useForceUpdate = useForceUpdate;
const qs_1 = require("qs");
const react_1 = require("react");
const types_js_1 = require("../../types.js");
const statusUpdatesMap = new Map([
    [undefined, /(unknown|success|approved|failed|pending|running)/],
    ['unknown', /(success|approved|failed|pending|running)/],
    ['success', /(approved|failed|pending|running)/],
    ['approved', /(failed|pending|running)/],
    ['failed', /(pending|running)/],
    ['pending', /running/],
]);
function makeEmptySuiteNode(path = []) {
    return {
        path,
        skip: true,
        opened: false,
        checked: true,
        indeterminate: false,
        children: {},
    };
}
function calcStatus(oldStatus, newStatus) {
    return newStatus && statusUpdatesMap.get(oldStatus)?.test(newStatus) ? newStatus : oldStatus;
}
function getTestPath(test) {
    const { browser, testName, storyPath } = test;
    return [...storyPath, testName, browser].filter(types_js_1.isDefined);
}
function getSuiteByPath(suite, path) {
    return path.reduce((suiteOrTest, pathToken) => (0, types_js_1.isTest)(suiteOrTest) ? suiteOrTest : suiteOrTest?.children[pathToken], suite);
}
function getTestByPath(suite, path) {
    const test = getSuiteByPath(suite, path) ?? suite;
    return (0, types_js_1.isTest)(test) ? test : null;
}
function getTestsByStoryId(suite, storyId) {
    return Object.values(suite.children)
        .filter(types_js_1.isDefined)
        .flatMap((suiteOrTest) => {
        if ((0, types_js_1.isTest)(suiteOrTest))
            return suiteOrTest.storyId === storyId ? suiteOrTest : [];
        return getTestsByStoryId(suiteOrTest, storyId);
    })
        .filter(types_js_1.isDefined);
}
function checkTests(suiteOrTest, checked) {
    suiteOrTest.checked = checked;
    if (!(0, types_js_1.isTest)(suiteOrTest)) {
        suiteOrTest.indeterminate = false;
        Object.values(suiteOrTest.children)
            .filter(types_js_1.isDefined)
            .forEach((child) => {
            checkTests(child, checked);
        });
    }
}
function updateChecked(suite) {
    const children = Object.values(suite.children)
        .filter(types_js_1.isDefined)
        .filter((child) => !child.skip);
    const checkedEvery = children.every((test) => test.checked);
    const checkedSome = children.some((test) => test.checked);
    const indeterminate = children.some((test) => ((0, types_js_1.isTest)(test) ? false : test.indeterminate)) || (!checkedEvery && checkedSome);
    const checked = indeterminate || suite.checked == checkedEvery ? suite.checked : checkedEvery;
    suite.checked = checked;
    suite.indeterminate = indeterminate;
}
function checkSuite(suite, path, checked) {
    const subSuite = getSuiteByPath(suite, path);
    if (subSuite)
        checkTests(subSuite, checked);
    path
        .slice(0, -1)
        .map((_, index, tokens) => tokens.slice(0, tokens.length - index))
        .forEach((parentPath) => {
        const parentSuite = getSuiteByPath(suite, parentPath);
        if ((0, types_js_1.isTest)(parentSuite))
            return;
        if (parentSuite)
            updateChecked(parentSuite);
    });
    updateChecked(suite);
}
function treeifyTests(testsById) {
    const rootSuite = makeEmptySuiteNode();
    rootSuite.opened = true;
    Object.values(testsById).forEach((test) => {
        if (!test)
            return;
        const [browser, ...testPath] = getTestPath(test).reverse();
        const lastSuite = testPath.reverse().reduce((suite, token) => {
            const subSuite = suite.children[token] ?? makeEmptySuiteNode([...suite.path, token]);
            subSuite.status = calcStatus(subSuite.status, test.status);
            if (!test.skip)
                subSuite.skip = false;
            if (!subSuite.skip)
                suite.skip = false;
            suite.children[token] = subSuite;
            suite.status = calcStatus(suite.status, subSuite.status);
            if ((0, types_js_1.isTest)(subSuite)) {
                throw new Error(`Suite and Test should not have same path '${JSON.stringify(getTestPath(subSuite))}'`);
            }
            return subSuite;
        }, rootSuite);
        lastSuite.children[browser] = { ...test, checked: true };
    });
    return rootSuite;
}
function getCheckedTests(suite) {
    return Object.values(suite.children)
        .filter(types_js_1.isDefined)
        .flatMap((suiteOrTest) => {
        if ((0, types_js_1.isTest)(suiteOrTest))
            return suiteOrTest.checked ? suiteOrTest : [];
        if (!suiteOrTest.checked && !suiteOrTest.indeterminate)
            return [];
        return getCheckedTests(suiteOrTest);
    });
}
function getFailedTests(suite) {
    return Object.values(suite.children)
        .filter(types_js_1.isDefined)
        .flatMap((suiteOrTest) => {
        if ((0, types_js_1.isTest)(suiteOrTest))
            return suiteOrTest.status === 'failed' ? suiteOrTest : [];
        return getFailedTests(suiteOrTest);
    });
}
function updateTestStatus(suite, path, update) {
    const title = path.shift();
    if (!title)
        return;
    const suiteOrTest = suite.children[title] ??
        (suite.children[title] = {
            ...(path.length == 0 ? update : makeEmptySuiteNode([...suite.path, title])),
            checked: suite.checked,
        });
    if ((0, types_js_1.isTest)(suiteOrTest)) {
        const test = suiteOrTest;
        const { skip, status, results, approved } = update;
        if ((0, types_js_1.isDefined)(skip))
            test.skip = skip;
        if ((0, types_js_1.isDefined)(status))
            test.status = status;
        if ((0, types_js_1.isDefined)(results)) {
            if (test.results)
                test.results.push(...results);
            else
                test.results = results;
        }
        if (approved === null)
            test.approved = null;
        else if (approved !== undefined)
            Object.entries(approved).forEach(([image, retry]) => retry !== undefined && ((test.approved = test.approved ?? {})[image] = retry));
    }
    else {
        const subSuite = suiteOrTest;
        updateTestStatus(subSuite, path, update);
    }
    suite.skip = Object.values(suite.children)
        .filter(types_js_1.isDefined)
        .map(({ skip }) => skip)
        .every(Boolean);
    suite.status = Object.values(suite.children)
        .filter(types_js_1.isDefined)
        .map(({ status }) => status)
        .reduce(calcStatus);
}
function removeTests(suite, path) {
    const title = path.shift();
    if (!title)
        return;
    const suiteOrTest = suite.children[title];
    if (suiteOrTest && !(0, types_js_1.isTest)(suiteOrTest))
        removeTests(suiteOrTest, path);
    if ((0, types_js_1.isTest)(suiteOrTest) || Object.keys(suiteOrTest?.children ?? {}).length == 0) {
        // TODO Use Map instead
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete suite.children[title];
    }
    if (Object.keys(suite.children).length == 0)
        return;
    updateChecked(suite);
    suite.skip = Object.values(suite.children)
        .filter(types_js_1.isDefined)
        .map(({ skip }) => skip)
        .every(Boolean);
    suite.status = Object.values(suite.children)
        .filter(types_js_1.isDefined)
        .map(({ status }) => status)
        .reduce(calcStatus);
}
// TODO Include images to test suite
// TODO If only one image in test, don't include it
function filterTests(suite, filter) {
    const { status, subStrings } = filter;
    if (!status && !subStrings.length)
        return suite;
    const filteredSuite = { ...suite, children: {} };
    Object.entries(suite.children).forEach(([title, suiteOrTest]) => {
        if (!suiteOrTest || suiteOrTest.skip)
            return;
        if (!status && subStrings.some((subString) => title.toLowerCase().includes(subString))) {
            filteredSuite.children[title] = suiteOrTest;
        }
        else if ((0, types_js_1.isTest)(suiteOrTest)) {
            if (status && suiteOrTest.status && ['pending', 'running', status].includes(suiteOrTest.status))
                filteredSuite.children[title] = suiteOrTest;
        }
        else {
            const filteredSubSuite = filterTests(suiteOrTest, filter);
            if (Object.keys(filteredSubSuite.children).length == 0)
                return;
            filteredSuite.children[title] = filteredSubSuite;
        }
    });
    return filteredSuite;
}
function openSuite(suite, path, opened) {
    const subSuite = path.reduce((suiteOrTest, pathToken) => {
        if (suiteOrTest && !(0, types_js_1.isTest)(suiteOrTest)) {
            if (opened)
                suiteOrTest.opened = opened;
            return suiteOrTest.children[pathToken];
        }
    }, suite);
    if (subSuite && !(0, types_js_1.isTest)(subSuite))
        subSuite.opened = opened;
}
function flattenSuite(suite) {
    if (!suite.opened)
        return [];
    return Object.entries(suite.children).flatMap(([title, subSuite]) => subSuite ? [{ title, suite: subSuite }, ...((0, types_js_1.isTest)(subSuite) ? [] : flattenSuite(subSuite))] : []);
}
function countTestsStatus(suite) {
    let successCount = 0;
    let failedCount = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    const cases = Object.values(suite.children).filter(types_js_1.isDefined);
    let suiteOrTest;
    while ((suiteOrTest = cases.pop())) {
        if ((0, types_js_1.isTest)(suiteOrTest)) {
            if (suiteOrTest.status === 'approved')
                approvedCount++;
            if (suiteOrTest.status === 'success')
                successCount++;
            if (suiteOrTest.status === 'failed')
                failedCount++;
            if (suiteOrTest.status === 'pending')
                pendingCount++;
        }
        else {
            cases.push(...Object.values(suiteOrTest.children).filter(types_js_1.isDefined));
        }
    }
    return { approvedCount, successCount, failedCount, pendingCount };
}
function getConnectionUrl() {
    return [
        typeof __CREEVEY_SERVER_HOST__ == 'undefined' ? window.location.hostname : __CREEVEY_SERVER_HOST__,
        typeof __CREEVEY_SERVER_PORT__ == 'undefined' ? window.location.port : __CREEVEY_SERVER_PORT__,
    ]
        .filter(Boolean)
        .join(':');
}
function getImageUrl(path, imageName, isReport) {
    // path => [title, story, test, browser]
    const browser = path.slice(-1)[0];
    const imagesUrl = window.location.host
        ? `${window.location.protocol}//${getConnectionUrl()}${window.location.pathname == '/' && !isReport
            ? '/report'
            : window.location.pathname.split('/').slice(0, -1).join('/')}/${encodeURI(path.slice(0, -1).join('/'))}`
        : encodeURI(path.slice(0, -1).join('/'));
    return imageName == browser ? imagesUrl : `${imagesUrl}/${encodeURI(browser)}`;
}
function getBorderSize(element) {
    // NOTE Firefox returns empty string for `borderWidth` prop
    const borderSize = parseFloat(getComputedStyle(element).borderTopWidth);
    return Number.isNaN(borderSize) ? 0 : borderSize;
}
function useLoadImages(s1, s2, s3) {
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        setLoaded(false);
        void Promise.all([s1, s2, s3].map((url) => new Promise((resolve) => {
            const image = document.createElement('img');
            image.src = url;
            image.onload = resolve;
            image.onerror = resolve;
        }))).then(() => {
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
function useResizeObserver(elementRef, onResize, debounceTimeout = 16) {
    const observerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!elementRef.current)
            return;
        observerRef.current = new ResizeObserver(onResize);
        observerRef.current.observe(elementRef.current);
        return () => observerRef.current?.disconnect();
    }, [debounceTimeout, elementRef, onResize]);
}
function useApplyScale(imageRef, scale, dependency) {
    (0, react_1.useLayoutEffect)(() => {
        if (!imageRef.current)
            return;
        const image = imageRef.current;
        const borderSize = getBorderSize(image);
        image.style.height = `${image.naturalHeight * scale + borderSize * 2}px`;
    }, [imageRef, scale, dependency]);
}
function useCalcScale(diffImageRef, loaded) {
    const [scale, setScale] = (0, react_1.useState)(1);
    const calcScale = (0, react_1.useCallback)(() => {
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
    (0, react_1.useLayoutEffect)(calcScale, [calcScale]);
    return scale;
}
function setSearchParams(testPath) {
    const pageUrl = `?${(0, qs_1.stringify)({ testPath })}`;
    window.history.pushState({ testPath }, '', pageUrl);
}
function getTestPathFromSearch() {
    const { testPath } = (0, qs_1.parse)(window.location.search.slice(1));
    if (Array.isArray(testPath) && testPath.every((token) => typeof token == 'string')) {
        return testPath;
    }
    return [];
}
function useForceUpdate() {
    const [, update] = (0, react_1.useState)({});
    return (0, react_1.useCallback)(() => {
        update({});
    }, []);
}
//# sourceMappingURL=helpers.js.map