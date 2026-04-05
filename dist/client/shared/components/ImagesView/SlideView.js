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
exports.SlideView = void 0;
const react_1 = __importStar(require("react"));
const components_1 = require("storybook/internal/components");
const theming_1 = require("storybook/theming");
const common_js_1 = require("./common.js");
const helpers_js_1 = require("../../helpers.js");
const Container = theming_1.styled.div({
    position: 'relative',
    display: 'flex',
});
const Input = theming_1.styled.input({
    position: 'absolute',
    cursor: 'ew-resize',
    appearance: 'none',
    background: 'none',
    boxShadow: 'none',
    outline: 'none',
    height: '100%',
    width: '100%',
    margin: '0',
    zIndex: 1,
    '&::-webkit-slider-runnable-track': {
        height: '100%',
    },
    '&::-webkit-slider-thumb': {
        boxShadow: '0 0 0 0.5px #888',
        height: '100%',
        width: '0px',
        appearance: 'none',
    },
    '&::-moz-focus-outer': {
        border: '0',
    },
    '&::-moz-range-track': {
        height: '0',
    },
    '&::-moz-range-thumb': {
        border: 'none',
        boxShadow: '0 0 0 0.5px #888',
        height: '100%',
        width: '0px',
    },
});
const ImageContainer = theming_1.styled.div({
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
});
const ImageWrapper = (0, theming_1.withTheme)(theming_1.styled.div(({ theme }) => ({
    background: theme.base == 'light' ? theme.color.mediumlight : theme.color.darker,
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
})));
const BaseImage = theming_1.styled.img(({ borderColor }) => ({
    boxSizing: 'border-box',
    border: `1px solid ${borderColor}`,
    maxWidth: '100%',
}));
const Image = (0, theming_1.styled)(BaseImage)({
    position: 'absolute',
});
const DiffImage = (0, theming_1.styled)(BaseImage)({
    opacity: '0',
});
exports.SlideView = (0, theming_1.withTheme)(({ actual, diff, expect, theme }) => {
    const [step, setStep] = (0, react_1.useState)(0);
    const expectedImageContainerRef = (0, react_1.useRef)(null);
    const expectedImageWrapperRef = (0, react_1.useRef)(null);
    const expectImageRef = (0, react_1.useRef)(null);
    const diffImageRef = (0, react_1.useRef)(null);
    const actualImageRef = (0, react_1.useRef)(null);
    const loaded = (0, helpers_js_1.useLoadImages)(expect, diff, actual);
    const scale = (0, helpers_js_1.useCalcScale)(diffImageRef, loaded);
    (0, helpers_js_1.useApplyScale)(expectImageRef, scale);
    (0, helpers_js_1.useApplyScale)(actualImageRef, scale);
    const handleSlide = (0, react_1.useCallback)((event) => {
        if (!expectedImageContainerRef.current || !expectedImageWrapperRef.current)
            return;
        const offset = Number(event.target.value);
        expectedImageContainerRef.current.style.right = `${100 - offset}%`;
        expectedImageWrapperRef.current.style.left = `${100 - offset}%`;
    }, []);
    (0, react_1.useLayoutEffect)(() => {
        if (loaded && diffImageRef.current)
            setStep(100 / diffImageRef.current.getBoundingClientRect().width);
    }, [loaded, scale]);
    (0, react_1.useLayoutEffect)(() => {
        if (loaded && expectedImageContainerRef.current && expectedImageWrapperRef.current) {
            expectedImageContainerRef.current.style.right = '100%';
            expectedImageWrapperRef.current.style.left = '100%';
        }
    }, [loaded]);
    return loaded ? (react_1.default.createElement(Container, null,
        react_1.default.createElement(Input, { "data-testid": "slider", type: "range", min: 0, max: 100, defaultValue: 0, step: step, onChange: handleSlide }),
        react_1.default.createElement(ImageContainer, null,
            react_1.default.createElement(ImageWrapper, null,
                react_1.default.createElement(Image, { ref: actualImageRef, borderColor: (0, common_js_1.getBorderColor)(theme, common_js_1.themeBorderColors.actual), alt: "actual", src: actual }))),
        react_1.default.createElement(ImageContainer, { ref: expectedImageContainerRef },
            react_1.default.createElement(ImageWrapper, { ref: expectedImageWrapperRef },
                react_1.default.createElement(Image, { ref: expectImageRef, borderColor: (0, common_js_1.getBorderColor)(theme, common_js_1.themeBorderColors.expect), alt: "expect", src: expect }))),
        react_1.default.createElement(DiffImage, { ref: diffImageRef, borderColor: 'transparent', alt: "diff", src: diff }))) : (react_1.default.createElement(components_1.Loader, { size: 64 }));
});
//# sourceMappingURL=SlideView.js.map