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
exports.Search = void 0;
const react_1 = __importStar(require("react"));
const icons_1 = require("@storybook/icons");
const theming_1 = require("storybook/theming");
const CreeveyContext_js_1 = require("../../CreeveyContext.js");
const FilterField = (0, theming_1.withTheme)(theming_1.styled.input(({ theme }) => ({
    appearance: 'none',
    border: 'none',
    boxSizing: 'border-box',
    display: 'block',
    outline: 'none',
    width: '100%',
    background: 'transparent',
    padding: 0,
    fontSize: 'inherit',
    '&:-webkit-autofill': { WebkitBoxShadow: `0 0 0 3em ${theme.color.lightest} inset` },
    '::placeholder': {
        color: theme.color.mediumdark,
    },
    '&:placeholder-shown ~ button': {
        opacity: 0,
    },
})));
const CancelButton = (0, theming_1.withTheme)(theming_1.styled.button(({ theme }) => ({
    border: 0,
    margin: 0,
    padding: 4,
    textDecoration: 'none',
    background: theme.appBorderColor,
    borderRadius: '1em',
    cursor: 'pointer',
    opacity: 1,
    transition: 'all 150ms ease-out',
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    right: 2,
    '> svg': {
        display: 'block',
        height: 8,
        width: 8,
        color: theme.input.color,
        transition: 'all 150ms ease-out',
    },
})));
const FilterForm = (0, theming_1.withTheme)(theming_1.styled.form(({ theme, focussed }) => ({
    transition: 'all 150ms ease-out',
    borderBottom: '1px solid transparent',
    borderBottomColor: theme.appBorderColor,
    outline: 0,
    position: 'relative',
    color: theme.input.color,
    input: {
        color: theme.input.color,
        fontSize: theme.typography.size.s2 - 1,
        lineHeight: '20px',
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 20,
        paddingRight: 20,
    },
    '> svg': {
        transition: 'all 150ms ease-out',
        position: 'absolute',
        top: '50%',
        height: 12,
        width: 12,
        transform: 'translateY(-50%)',
        zIndex: 1,
        background: 'transparent',
        path: {
            transition: 'all 150ms ease-out',
            fill: 'currentColor',
            opacity: focussed ? 1 : 0.3,
        },
    },
})));
const Search = ({ onChange, value }) => {
    const { setSidebarFocusedItem } = (0, CreeveyContext_js_1.useCreeveyContext)();
    const [focussed, onSetFocussed] = (0, react_1.useState)(false);
    const searchRef = (0, react_1.useRef)(null);
    return (react_1.default.createElement(FilterForm, { autoComplete: "off", focussed: focussed, onReset: () => {
            onChange('');
        }, onSubmit: (e) => {
            e.preventDefault();
        } },
        react_1.default.createElement(FilterField, { type: "text", ref: searchRef, onFocus: () => {
                onSetFocussed(true);
                setSidebarFocusedItem(null);
            }, onBlur: () => {
                onSetFocussed(false);
            }, onChange: (e) => {
                onChange(e.target.value);
            }, placeholder: "search by status or substring", value: value }),
        react_1.default.createElement(icons_1.SearchIcon, null),
        react_1.default.createElement(CancelButton, { tabIndex: -1, type: "reset", value: "reset", title: "Clear search" },
            react_1.default.createElement(icons_1.CloseAltIcon, null))));
};
exports.Search = Search;
//# sourceMappingURL=Search.js.map