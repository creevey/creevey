"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.themeBorderColors = void 0;
exports.getBorderColor = getBorderColor;
exports.themeBorderColors = {
    actual: 'negative',
    expect: 'positive',
    diff: 'secondary',
};
const isColor = (theme, color) => color in theme.color;
function getBorderColor(theme, color) {
    return isColor(theme, color) ? theme.color[color] : color;
}
//# sourceMappingURL=common.js.map