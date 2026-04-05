"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreeveyApp = CreeveyApp;
const react_1 = __importStar(require("react"));
const use_immer_1 = require("use-immer");
const theming_1 = require("storybook/theming");
const types_js_1 = require("../../types.js");
const helpers_js_1 = require("../shared/helpers.js");
const CreeveyContext_js_1 = require("./CreeveyContext.js");
const KeyboardEventsContext_js_1 = require("./KeyboardEventsContext.js");
const index_js_1 = require("./CreeveyView/SideBar/index.js");
const ResultsPage_js_1 = require("../shared/components/ResultsPage.js");
const Toggle_js_1 = require("./CreeveyView/SideBar/Toggle.js");
const themes_js_1 = require("./themes.js");
const FlexContainer = (0, theming_1.withTheme)(theming_1.styled.div(({ theme }) => ({
    height: '100vh',
    display: 'flex',
    background: theme.background.content,
    color: theme.color.defaultText,
})));
const ToggleContainer = theming_1.styled.div({
    zIndex: 1,
    position: 'absolute',
    right: 10,
    top: 10,
});
function CreeveyApp({ api, initialState }) {
    const [tests, updateTests] = (0, use_immer_1.useImmer)(initialState.tests);
    const [isRunning, setIsRunning] = (0, react_1.useState)(initialState.isRunning);
    const [openedTestPath, openTest] = (0, react_1.useState)([]);
    const [filter, setFilter] = (0, react_1.useState)({ status: null, subStrings: [] });
    const [theme, setTheme] = (0, themes_js_1.useTheme)();
    const openedTest = (0, helpers_js_1.getTestByPath)(tests, openedTestPath);
    const failedTests = (0, react_1.useMemo)(() => (0, helpers_js_1.getFailedTests)(tests), [tests]);
    const [retry, setRetry] = (0, react_1.useState)(openedTest?.results?.length ?? 0);
    const result = (0, react_1.useMemo)(() => openedTest?.results?.[retry - 1], [openedTest, retry]);
    const [imageName, setImageName] = (0, react_1.useState)(Object.keys(result?.images ?? {})[0] ?? '');
    const [sidebarFocusedItem, setSidebarFocusedItem] = (0, react_1.useState)([]);
    const canApprove = (0, react_1.useMemo)(() => Boolean(openedTest?.results?.[retry - 1]?.images &&
        openedTest.approved?.[imageName] != retry - 1 &&
        openedTest.results[retry - 1].status != 'success'), [imageName, openedTest, retry]);
    if (openedTestPath.length > 0 && !(0, types_js_1.isDefined)(openedTest))
        openTest([]);
    const handleSuiteOpen = (0, react_1.useCallback)((path, opened) => {
        updateTests((draft) => {
            (0, helpers_js_1.openSuite)(draft, path, opened);
        });
    }, [updateTests]);
    const handleSuiteToggle = (0, react_1.useCallback)((path, checked) => {
        updateTests((draft) => {
            (0, helpers_js_1.checkSuite)(draft, path, checked);
        });
    }, [updateTests]);
    const handleOpenTest = (0, react_1.useCallback)((test) => {
        const testPath = (0, helpers_js_1.getTestPath)(test);
        (0, helpers_js_1.setSearchParams)(testPath);
        setSidebarFocusedItem(testPath);
        updateTests((draft) => {
            (0, helpers_js_1.openSuite)(draft, testPath, true);
            openTest(testPath);
        });
    }, [updateTests]);
    const handleGoToNextFailedTest = (0, react_1.useCallback)(() => {
        if (failedTests.length == 0)
            return;
        const currentTest = failedTests.findIndex((t) => t.id === openedTest?.id);
        const failedImages = Object.entries(result?.images ?? {})
            .filter(([name, image]) => 
        // TODO Move to helpers, it duplicates in a few places
        Boolean(image?.error != null && openedTest?.approved?.[name] != retry - 1 && result?.status != 'success'))
            .map(([name]) => name);
        if (failedImages.length > 1 &&
            (failedTests.length == 1 || failedImages.indexOf(imageName) < failedImages.length - 1)) {
            setImageName((name) => failedImages[failedImages.indexOf(name) + 1] ?? failedImages[0]);
        }
        else {
            const nextFailedTest = failedTests[currentTest + 1] ?? failedTests[0];
            handleOpenTest(nextFailedTest);
        }
    }, [failedTests, handleOpenTest, openedTest, retry, result, imageName]);
    const handleImageApproveNew = (0, react_1.useCallback)(() => {
        const id = openedTest?.id;
        if (!id)
            return;
        api?.approve(id, retry - 1, imageName);
    }, [api, imageName, openedTest?.id, retry]);
    const handleImageApproveAndGoNext = (0, react_1.useCallback)(() => {
        handleImageApproveNew();
        handleGoToNextFailedTest();
    }, [handleImageApproveNew, handleGoToNextFailedTest]);
    const handleApproveAll = (0, react_1.useCallback)(() => {
        // TODO Update handled incorrectly
        api?.approveAll();
    }, [api]);
    const handleStart = (0, react_1.useCallback)((tests) => api?.start((0, helpers_js_1.getCheckedTests)(tests).map((test) => test.id)), [api]);
    const handleStop = (0, react_1.useCallback)(() => api?.stop(), [api]);
    const handleThemeChange = (0, react_1.useCallback)((isDark) => {
        setTheme(isDark ? 'dark' : 'light');
    }, [setTheme]);
    (0, react_1.useEffect)(() => {
        const retry = openedTest?.results?.length ?? 0;
        const result = openedTest?.results?.[retry - 1] ?? { images: {} };
        setImageName(Object.keys(result.images ?? {})[0] ?? '');
        setRetry(retry);
    }, [openedTest?.results]);
    (0, react_1.useEffect)(() => {
        window.addEventListener('popstate', (event) => {
            updateTests((draft) => {
                const state = event.state;
                if (state && typeof state == 'object' && 'testPath' in state) {
                    const { testPath } = state;
                    if (Array.isArray(testPath)) {
                        // TODO Add validations
                        (0, helpers_js_1.openSuite)(draft, testPath, true);
                        openTest(testPath);
                    }
                }
            });
        });
        updateTests((draft) => {
            const testPath = (0, helpers_js_1.getTestPathFromSearch)();
            (0, helpers_js_1.openSuite)(draft, testPath, true);
            openTest(testPath);
        });
    }, [updateTests]);
    // TODO unsubscribe
    (0, react_1.useEffect)(() => api?.onUpdate(({ isRunning, tests, removedTests = [] }) => {
        if ((0, types_js_1.isDefined)(isRunning))
            setIsRunning(isRunning);
        if ((0, types_js_1.isDefined)(tests))
            updateTests((draft) => {
                Object.values(tests).forEach((test) => {
                    if (test)
                        (0, helpers_js_1.updateTestStatus)(draft, (0, helpers_js_1.getTestPath)(test), test);
                });
                removedTests.forEach((test) => {
                    (0, helpers_js_1.removeTests)(draft, (0, helpers_js_1.getTestPath)(test));
                });
            });
    }), [api, updateTests]);
    return (react_1.default.createElement(CreeveyContext_js_1.CreeveyContext.Provider, { value: {
            isReport: initialState.isReport,
            isRunning,
            onImageNext: canApprove ? handleGoToNextFailedTest : undefined,
            onImageApprove: canApprove ? handleImageApproveAndGoNext : undefined,
            onApproveAll: handleApproveAll,
            onStart: handleStart,
            onStop: handleStop,
            onSuiteOpen: handleSuiteOpen,
            onSuiteToggle: handleSuiteToggle,
            sidebarFocusedItem,
            setSidebarFocusedItem,
            isUpdateMode: initialState.isUpdateMode,
        } },
        react_1.default.createElement(theming_1.ThemeProvider, { theme: (0, theming_1.ensure)(theming_1.themes[theme]) },
            react_1.default.createElement(KeyboardEventsContext_js_1.KeyboardEvents, { rootSuite: tests, filter: filter },
                react_1.default.createElement(FlexContainer, null,
                    react_1.default.createElement(index_js_1.SideBar, { rootSuite: tests, testId: openedTest?.id, onOpenTest: handleOpenTest, filter: filter, setFilter: setFilter }),
                    openedTest && (react_1.default.createElement(ResultsPage_js_1.ResultsPage, { key: `${openedTest.id}_${openedTest.results?.length ?? 0}`, path: openedTestPath, results: openedTest.results, approved: openedTest.approved, retry: retry, imageName: imageName, onImageChange: setImageName, onRetryChange: setRetry })),
                    react_1.default.createElement(ToggleContainer, null,
                        react_1.default.createElement(Toggle_js_1.Toggle, { value: theme == 'dark', onChange: handleThemeChange })))))));
}
//# sourceMappingURL=CreeveyApp.js.map