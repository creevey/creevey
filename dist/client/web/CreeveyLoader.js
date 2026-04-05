"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotate360 = void 0;
exports.CreeveyLoader = CreeveyLoader;
const react_1 = __importDefault(require("react"));
const theming_1 = require("storybook/theming");
const themes_js_1 = require("./themes.js");
const Container = (0, theming_1.withTheme)(theming_1.styled.div(({ theme }) => ({
    height: '100vh',
    width: '100vw',
    background: theme.background.app,
})));
const Loader = (0, theming_1.withTheme)(theming_1.styled.div(({ size = 32, theme }) => ({
    borderRadius: '50%',
    cursor: 'progress',
    display: 'inline-block',
    overflow: 'hidden',
    position: 'absolute',
    transition: 'all 200ms ease-out',
    verticalAlign: 'top',
    top: '50%',
    left: '50%',
    marginTop: -(size / 2),
    marginLeft: -(size / 2),
    height: size,
    width: size,
    zIndex: 4,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: theme.base === 'light' ? 'rgba(97, 97, 97, 0.29)' : 'rgba(255, 255, 255, 0.2)',
    borderTopColor: theme.base === 'light' ? 'rgb(100,100,100)' : 'rgba(255, 255, 255, 0.4)',
    animation: `${exports.rotate360} 0.7s linear infinite`,
    mixBlendMode: 'difference',
})));
exports.rotate360 = (0, theming_1.keyframes) `
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;
function CreeveyLoader() {
    const [theme] = (0, themes_js_1.useTheme)();
    return (react_1.default.createElement(theming_1.ThemeProvider, { theme: (0, theming_1.ensure)(theming_1.themes[theme]) },
        react_1.default.createElement(Container, null,
            react_1.default.createElement(Loader, { size: 64 }))));
}
//# sourceMappingURL=CreeveyLoader.js.map