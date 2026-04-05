"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTheme = useTheme;
const react_1 = require("react");
const theming_1 = require("storybook/theming");
const types_js_1 = require("../../types.js");
const CREEVEY_THEME = 'Creevey_theme';
function isTheme(theme) {
    return (0, types_js_1.isDefined)(theme) && Object.prototype.hasOwnProperty.call(theming_1.themes, theme);
}
function initialTheme() {
    const theme = localStorage.getItem(CREEVEY_THEME);
    return isTheme(theme) ? theme : 'light';
}
function useTheme() {
    const [theme, setTheme] = (0, react_1.useState)(initialTheme());
    (0, react_1.useEffect)(() => {
        localStorage.setItem(CREEVEY_THEME, theme);
    }, [theme]);
    return [theme, setTheme];
}
//# sourceMappingURL=themes.js.map