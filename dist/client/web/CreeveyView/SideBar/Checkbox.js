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
exports.Checkbox = exports.CheckboxContainer = void 0;
const react_1 = __importStar(require("react"));
const theming_1 = require("storybook/theming");
const icons_1 = require("@storybook/icons");
const polished_1 = require("polished");
const Label = (0, theming_1.withTheme)(theming_1.styled.label(({ theme, disabled }) => ({
    display: 'inline-flex',
    alignItems: 'baseline',
    position: 'relative',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    fontSize: theme.typography.size.s1,
    padding: '0px',
    pointerEvents: disabled ? 'none' : 'auto',
    input: {
        display: 'inline-block',
        opacity: '0',
        width: 0,
        height: 0,
        position: 'absolute',
        zIndex: -1,
        '&:focus + span': {
            outline: 'none',
            boxShadow: `${(0, polished_1.transparentize)(0.5, theme.color.defaultText)} 0 0 0 1px inset`,
        },
    },
})));
const Box = (0, theming_1.withTheme)(theming_1.styled.span(({ theme }) => ({
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: theme.appBorderColor,
    borderRadius: theme.input.borderRadius,
    margin: '2px',
    boxShadow: `${(0, polished_1.transparentize)(0.8, theme.color.defaultText)} 0 0 0 1px inset`,
    color: (0, polished_1.transparentize)(0.3, theme.color.defaultText),
    background: theme.background.content,
    '&:hover, &:focus': {
        outline: 'none',
        boxShadow: `${(0, polished_1.transparentize)(0.5, theme.color.defaultText)} 0 0 0 1px inset`,
    },
})));
const CircleIconStyled = (0, theming_1.styled)(icons_1.CircleIcon)({
    margin: '4px',
    verticalAlign: 'baseline',
});
const CheckIconStyled = (0, theming_1.styled)(icons_1.CheckIcon)({
    margin: '2px',
    verticalAlign: 'baseline',
});
exports.CheckboxContainer = theming_1.styled.span({
    paddingLeft: '8px',
    verticalAlign: 'middle',
    alignSelf: 'center',
    lineHeight: '18px',
});
class Checkbox extends react_1.Component {
    state = { indeterminate: false };
    handleIndeterminateChange = (value) => {
        this.setState({
            indeterminate: value,
        });
    };
    setIndeterminate = () => {
        this.handleIndeterminateChange(true);
    };
    resetIndeterminate = () => {
        this.handleIndeterminateChange(false);
    };
    render() {
        const { checked, disabled, onValueChange } = this.props;
        const { indeterminate } = this.state;
        return (react_1.default.createElement(Label, { disabled: disabled },
            react_1.default.createElement("input", { type: "checkbox", onChange: (e) => {
                    onValueChange(e.target.checked);
                }, checked: checked ?? false }),
            react_1.default.createElement(Box, null, indeterminate ? (react_1.default.createElement(CircleIconStyled, { width: "8", height: "8" })) : checked ? (react_1.default.createElement(CheckIconStyled, { width: "12", height: "12" })) : (' '))));
    }
}
exports.Checkbox = Checkbox;
//# sourceMappingURL=Checkbox.js.map