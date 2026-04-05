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
exports.TestLink = TestLink;
const react_1 = __importStar(require("react"));
const TestStatusIcon_js_1 = require("./TestStatusIcon.js");
const CreeveyContext_js_1 = require("../../CreeveyContext.js");
const SideBar_js_1 = require("./SideBar.js");
const SuiteLink_js_1 = require("./SuiteLink.js");
const Checkbox_js_1 = require("./Checkbox.js");
const helpers_js_1 = require("../../../shared/helpers.js");
const theming_1 = require("storybook/theming");
const TestContainer = (0, theming_1.styled)(SuiteLink_js_1.SuiteContainer)({
    gridTemplateColumns: 'min-content auto',
});
function TestLink({ title, opened, test }) {
    const { onSuiteToggle, sidebarFocusedItem, setSidebarFocusedItem, isUpdateMode } = (0, CreeveyContext_js_1.useCreeveyContext)();
    const { onOpenTest } = (0, react_1.useContext)(SideBar_js_1.SideBarContext);
    const buttonRef = (0, react_1.useRef)(null);
    const emptyResults = (test.results?.length ?? 0) == 0;
    const testPath = (0, react_1.useMemo)(() => (0, helpers_js_1.getTestPath)(test), [test]);
    const isTestFocused = (0, react_1.useMemo)(() => Array.isArray(sidebarFocusedItem) &&
        testPath.length === sidebarFocusedItem.length &&
        testPath.every((x) => sidebarFocusedItem.includes(x)), [testPath, sidebarFocusedItem]);
    const handleCheck = (0, react_1.useCallback)((value) => {
        onSuiteToggle(testPath, value);
    }, [testPath, onSuiteToggle]);
    (0, react_1.useEffect)(() => {
        if (isTestFocused)
            buttonRef.current?.focus();
    }, [isTestFocused]);
    const handleOpen = (0, react_1.useCallback)(() => {
        onOpenTest(test);
        setSidebarFocusedItem((0, helpers_js_1.getTestPath)(test));
    }, [test, onOpenTest, setSidebarFocusedItem]);
    return (react_1.default.createElement(SuiteLink_js_1.Container, { disabled: emptyResults, active: opened, focused: isTestFocused },
        react_1.default.createElement(Checkbox_js_1.CheckboxContainer, null, !isUpdateMode && (react_1.default.createElement(Checkbox_js_1.Checkbox, { checked: test.skip ? false : test.checked, disabled: Boolean(test.skip), onValueChange: handleCheck }))),
        react_1.default.createElement(SuiteLink_js_1.Button, { onClick: handleOpen, disabled: emptyResults, ref: buttonRef },
            react_1.default.createElement(TestContainer, { padding: (testPath.length + 1) * 8 },
                react_1.default.createElement(TestStatusIcon_js_1.TestStatusIcon, { inverted: opened, status: test.status, skip: test.skip }),
                react_1.default.createElement(SuiteLink_js_1.SuiteTitle, null, title)))));
}
//# sourceMappingURL=TestLink.js.map