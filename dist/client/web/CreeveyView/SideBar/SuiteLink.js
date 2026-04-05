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
exports.SuiteTitle = exports.SuiteContainer = exports.Button = exports.Container = void 0;
exports.SuiteLink = SuiteLink;
const react_1 = __importStar(require("react"));
const icons_1 = require("@storybook/icons");
const theming_1 = require("storybook/theming");
const Checkbox_js_1 = require("./Checkbox.js");
const TestStatusIcon_js_1 = require("./TestStatusIcon.js");
const types_js_1 = require("../../../../types.js");
const CreeveyContext_js_1 = require("../../CreeveyContext.js");
exports.Container = (0, theming_1.withTheme)(theming_1.styled.div(({ theme, disabled, active, focused }) => ({
    position: 'relative',
    width: '100%',
    height: '28px',
    lineHeight: '20px',
    display: 'flex',
    background: active ? theme.color.secondary : focused ? theme.background.hoverable : 'none',
    color: active ? theme.color.inverseText : 'inherit',
    outline: focused ? `1px solid ${theme.color.ancillary}` : 'none',
    ...(disabled ? { color: theme.color.mediumdark, pointerEvents: 'none' } : {}),
    // NOTE There is no way to trigger hover from js, so we add `.hover` class for testing purpose
    '&:hover, &.hover': active
        ? {}
        : {
            background: theme.background.hoverable,
        },
})));
exports.Button = (0, theming_1.withTheme)(theming_1.styled.button(({ theme, active }) => ({
    flexGrow: 1,
    boxSizing: 'border-box',
    appearance: 'none',
    padding: '4px 16px 4px 8px',
    lineHeight: '18px',
    cursor: 'pointer',
    border: 'none',
    zIndex: 1,
    textAlign: 'left',
    background: 'none',
    outline: 'none',
    color: active ? theme.color.inverseText : 'inherit',
})));
const iconStyles = {
    paddingRight: '4px',
    display: 'inline-block',
    width: '12px',
    height: '18px',
    verticalAlign: 'unset',
};
const ChevronDownIconStyled = (0, theming_1.styled)(icons_1.ChevronDownIcon)(iconStyles);
const ChevronRightIconStyled = (0, theming_1.styled)(icons_1.ChevronRightIcon)(iconStyles);
exports.SuiteContainer = theming_1.styled.span(({ padding }) => ({
    paddingLeft: padding,
    whiteSpace: 'normal',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, min-content) auto',
}));
exports.SuiteTitle = theming_1.styled.span({
    paddingLeft: '4px',
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
});
function SuiteLink({ title, suite, 'data-testid': dataTid }) {
    const { onSuiteOpen, onSuiteToggle, sidebarFocusedItem, setSidebarFocusedItem, isUpdateMode } = (0, CreeveyContext_js_1.useCreeveyContext)();
    const checkboxRef = (0, react_1.useRef)(null);
    const buttonRef = (0, react_1.useRef)(null);
    const isSuiteFocused = (0, react_1.useMemo)(() => Array.isArray(sidebarFocusedItem) &&
        sidebarFocusedItem.length === suite.path.length &&
        sidebarFocusedItem.every((x) => suite.path.includes(x)), [suite, sidebarFocusedItem]);
    (0, react_1.useEffect)(() => (suite.indeterminate ? checkboxRef.current?.setIndeterminate() : checkboxRef.current?.resetIndeterminate()), [suite.indeterminate]);
    (0, react_1.useEffect)(() => {
        if (isSuiteFocused)
            buttonRef.current?.focus();
    }, [isSuiteFocused]);
    const isRootSuite = suite.path.length == 0;
    const handleCheck = (value) => {
        onSuiteToggle(suite.path, value);
    };
    const handleOpen = () => {
        if (!isRootSuite) {
            onSuiteOpen(suite.path, !suite.opened);
            setSidebarFocusedItem(suite.path);
        }
    };
    const handleFocus = () => {
        setSidebarFocusedItem(suite.path);
    };
    return (react_1.default.createElement(exports.Container, { focused: isSuiteFocused },
        react_1.default.createElement(Checkbox_js_1.CheckboxContainer, null, !isUpdateMode && (react_1.default.createElement(Checkbox_js_1.Checkbox, { ref: checkboxRef, checked: suite.skip ? false : suite.checked, disabled: Boolean(suite.skip), onValueChange: handleCheck }))),
        react_1.default.createElement(exports.Button, { onClick: handleOpen, onFocus: handleFocus, "data-testid": dataTid, ref: buttonRef },
            react_1.default.createElement(exports.SuiteContainer, { padding: (suite.path.length - 1) * 8 },
                (0, types_js_1.isTest)(suite) ||
                    (Boolean(suite.path.length) && (suite.opened ? react_1.default.createElement(ChevronDownIconStyled, null) : react_1.default.createElement(ChevronRightIconStyled, null))),
                react_1.default.createElement(TestStatusIcon_js_1.TestStatusIcon, { status: suite.status, skip: suite.skip }),
                react_1.default.createElement(exports.SuiteTitle, null, title)))));
}
//# sourceMappingURL=SuiteLink.js.map