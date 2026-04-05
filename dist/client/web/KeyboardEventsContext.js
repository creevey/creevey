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
exports.KeyboardEvents = void 0;
const react_1 = __importStar(require("react"));
const types_js_1 = require("../../types.js");
const helpers_js_1 = require("../shared/helpers.js");
const CreeveyContext_js_1 = require("./CreeveyContext.js");
const KeyboardEvents = ({ children, rootSuite, filter, }) => {
    const { onSuiteOpen, onSuiteToggle, sidebarFocusedItem, setSidebarFocusedItem } = (0, CreeveyContext_js_1.useCreeveyContext)();
    const suiteList = (0, helpers_js_1.flattenSuite)((0, helpers_js_1.filterTests)(rootSuite, filter));
    const getFocusedItemIndex = (0, react_1.useCallback)((item) => {
        return suiteList.findIndex((x) => {
            const path = (0, types_js_1.isTest)(x.suite) ? (0, helpers_js_1.getTestPath)(x.suite) : x.suite.path;
            return item.length === path.length && item.every((focusedPath) => path.includes(focusedPath));
        });
    }, [suiteList]);
    const handleKeyDown = (0, react_1.useCallback)((e) => {
        if (sidebarFocusedItem === null)
            return;
        switch (e.code) {
            case 'Enter': {
                if (sidebarFocusedItem.length === 0)
                    return;
                const focusedSuite = (0, helpers_js_1.getSuiteByPath)(rootSuite, sidebarFocusedItem);
                if (!focusedSuite)
                    return;
                if (!(0, types_js_1.isTest)(focusedSuite)) {
                    e.preventDefault();
                    onSuiteOpen(focusedSuite.path, !focusedSuite.opened);
                }
                if ((0, types_js_1.isTest)(focusedSuite) && focusedSuite.results?.length == 0) {
                    e.preventDefault();
                }
                return;
            }
            case 'Space': {
                e.preventDefault();
                // TODO handle keys in one place
                if (e.altKey)
                    return;
                const focusedSuite = (0, helpers_js_1.getSuiteByPath)(rootSuite, sidebarFocusedItem);
                if (!focusedSuite)
                    return;
                const path = (0, types_js_1.isTest)(focusedSuite) ? (0, helpers_js_1.getTestPath)(focusedSuite) : focusedSuite.path;
                onSuiteToggle(path, !focusedSuite.checked);
                return;
            }
            case 'ArrowDown': {
                const currentIndex = sidebarFocusedItem.length === 0 ? -1 : getFocusedItemIndex(sidebarFocusedItem);
                if (currentIndex === suiteList.length - 1)
                    return;
                const nextSuite = suiteList[currentIndex + 1];
                const nextPath = (0, types_js_1.isTest)(nextSuite.suite) ? (0, helpers_js_1.getTestPath)(nextSuite.suite) : nextSuite.suite.path;
                setSidebarFocusedItem(nextPath);
                return;
            }
            case 'ArrowUp': {
                const currentIndex = sidebarFocusedItem.length === 0 ? 0 : getFocusedItemIndex(sidebarFocusedItem);
                const nextSuite = currentIndex > 0 ? suiteList[currentIndex - 1].suite : rootSuite;
                const nextPath = (0, types_js_1.isTest)(nextSuite) ? (0, helpers_js_1.getTestPath)(nextSuite) : nextSuite.path;
                setSidebarFocusedItem(nextPath);
                return;
            }
            case 'ArrowRight': {
                if (sidebarFocusedItem.length === 0)
                    return;
                const focusedSuite = (0, helpers_js_1.getSuiteByPath)(rootSuite, sidebarFocusedItem);
                if (!focusedSuite || (0, types_js_1.isTest)(focusedSuite))
                    return;
                onSuiteOpen(focusedSuite.path, true);
                return;
            }
            case 'ArrowLeft': {
                if (sidebarFocusedItem.length === 0)
                    return;
                const focusedSuite = (0, helpers_js_1.getSuiteByPath)(rootSuite, sidebarFocusedItem);
                if (!focusedSuite)
                    return;
                if (!(0, types_js_1.isTest)(focusedSuite) && focusedSuite.opened) {
                    onSuiteOpen(focusedSuite.path, false);
                    return;
                }
                const path = (0, types_js_1.isTest)(focusedSuite) ? (0, helpers_js_1.getTestPath)(focusedSuite) : focusedSuite.path;
                setSidebarFocusedItem(path.slice(0, -1));
                return;
            }
        }
    }, [onSuiteOpen, onSuiteToggle, rootSuite, suiteList, getFocusedItemIndex, sidebarFocusedItem, setSidebarFocusedItem]);
    (0, react_1.useEffect)(() => {
        document.addEventListener('keydown', handleKeyDown, false);
        return () => {
            document.removeEventListener('keydown', handleKeyDown, false);
        };
    }, [handleKeyDown]);
    return react_1.default.createElement(react_1.default.Fragment, null, children);
};
exports.KeyboardEvents = KeyboardEvents;
//# sourceMappingURL=KeyboardEventsContext.js.map