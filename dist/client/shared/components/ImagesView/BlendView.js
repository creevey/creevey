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
exports.BlendView = void 0;
const react_1 = __importStar(require("react"));
const theming_1 = require("storybook/theming");
const common_js_1 = require("./common.js");
const helpers_js_1 = require("../../helpers.js");
const Container = theming_1.styled.div({
    position: 'relative',
    display: 'flex',
    filter: 'invert(100%)',
});
const ImageContainer = theming_1.styled.div({
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
});
const Image = theming_1.styled.img(({ borderColor }) => ({
    boxSizing: 'border-box',
    border: `1px solid ${borderColor}`,
    maxWidth: '100%',
    filter: 'invert(100%)',
}));
const ActualImage = (0, theming_1.styled)(Image)({
    mixBlendMode: 'difference',
});
const DiffImage = (0, theming_1.styled)(Image)({
    opacity: '0',
});
exports.BlendView = (0, theming_1.withTheme)(({ actual, diff, expect, theme }) => {
    const expectImageRef = (0, react_1.useRef)(null);
    const diffImageRef = (0, react_1.useRef)(null);
    const actualImageRef = (0, react_1.useRef)(null);
    const loaded = (0, helpers_js_1.useLoadImages)(expect, diff, actual);
    const scale = (0, helpers_js_1.useCalcScale)(diffImageRef, loaded);
    (0, helpers_js_1.useApplyScale)(expectImageRef, scale, loaded);
    (0, helpers_js_1.useApplyScale)(actualImageRef, scale, loaded);
    return (react_1.default.createElement(Container, null,
        react_1.default.createElement(ImageContainer, null,
            react_1.default.createElement(Image, { ref: expectImageRef, borderColor: (0, common_js_1.getBorderColor)(theme, common_js_1.themeBorderColors.expect), alt: "expect", src: expect })),
        react_1.default.createElement(DiffImage, { ref: diffImageRef, borderColor: 'transparent', alt: "diff", src: diff }),
        react_1.default.createElement(ImageContainer, null,
            react_1.default.createElement(ActualImage, { ref: actualImageRef, borderColor: (0, common_js_1.getBorderColor)(theme, common_js_1.themeBorderColors.actual), alt: "actual", src: actual }))));
});
//# sourceMappingURL=BlendView.js.map