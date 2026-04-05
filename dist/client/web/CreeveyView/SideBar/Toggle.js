"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toggle = void 0;
const react_1 = __importDefault(require("react"));
const theming_1 = require("storybook/theming");
const polished_1 = require("polished");
const Container = (0, theming_1.withTheme)(theming_1.styled.span(({ theme }) => ({
    lineHeight: '10px',
    display: 'inline-block',
    position: 'relative',
    whiteSpace: 'nowrap',
    background: theme.base == 'light' ? theme.color.mediumlight : theme.color.darker,
    borderRadius: '3em',
    padding: 2,
    verticalAlign: 'middle',
    marginLeft: 10,
    input: {
        appearance: 'none',
        width: '100%',
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
        margin: 0,
        padding: 0,
        border: 'none',
        cursor: 'pointer',
        '&:focus': {
            outline: 'none',
        },
    },
    span: {
        cursor: 'pointer',
        display: 'inline-block',
        transition: 'all 100ms ease-out',
        userSelect: 'none',
        borderRadius: '100%',
        background: theme.background.bar,
        boxShadow: `${(0, polished_1.opacify)(0.1, theme.appBorderColor)} 0 0 2px`,
        color: theme.color.defaultText,
        width: 20,
        height: 20,
        boxSizing: 'border-box',
        lineHeight: '19px',
        textAlign: 'center',
        '&:hover': {
            boxShadow: `${(0, polished_1.opacify)(0.3, theme.appBorderColor)} 0 0 0 1px inset`,
        },
        '&:active': {
            boxShadow: `${(0, polished_1.opacify)(0.05, theme.appBorderColor)} 0 0 0 2px inset`,
        },
    },
    'input:checked ~ span': {
        marginLeft: 20,
    },
    'input:not(:checked) ~ span': {
        marginRight: 20,
    },
})));
const Toggle = ({ value, onChange }) => (react_1.default.createElement(Container, null,
    react_1.default.createElement("input", { type: "checkbox", onChange: () => {
            onChange(!value);
        }, checked: value ?? false }),
    react_1.default.createElement("span", null, value ? '☪' : '☀')));
exports.Toggle = Toggle;
//# sourceMappingURL=Toggle.js.map