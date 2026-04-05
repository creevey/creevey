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
exports.SideBySideView = void 0;
const react_1 = __importStar(require("react"));
const components_1 = require("storybook/internal/components");
const theming_1 = require("storybook/theming");
const common_js_1 = require("./common.js");
const helpers_js_1 = require("../../helpers.js");
const Container = theming_1.styled.div({
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
});
const ImagesLayout = theming_1.styled.div(({ layout }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: layout == 'horizontal' ? 'row' : 'column',
    '& > :not(:first-of-type)': {
        marginLeft: layout == 'horizontal' ? '20px' : 0,
        marginTop: layout == 'horizontal' ? 0 : '20px',
    },
}));
const ImageLink = theming_1.styled.a({
    lineHeight: 0,
    flexShrink: 0,
});
const ImageDiffLink = theming_1.styled.a({
    lineHeight: 0,
});
const Image = theming_1.styled.img(({ borderColor }) => ({
    boxSizing: 'border-box',
    border: `1px solid ${borderColor}`,
    maxWidth: '100%',
    flexShrink: 0,
}));
const DiffImage = (0, theming_1.styled)(Image)({
    flexShrink: 1,
});
exports.SideBySideView = (0, theming_1.withTheme)(({ actual, diff, expect, theme }) => {
    const [layout, setLayout] = (0, react_1.useState)('horizontal');
    const [scale, setScale] = (0, react_1.useState)(1);
    const containerRef = (0, react_1.useRef)(null);
    const expectImageRef = (0, react_1.useRef)(null);
    const diffImageRef = (0, react_1.useRef)(null);
    const actualImageRef = (0, react_1.useRef)(null);
    const loaded = (0, helpers_js_1.useLoadImages)(expect, diff, actual);
    const calcScale = (0, react_1.useCallback)(() => {
        const containerElement = containerRef.current;
        const expectImage = expectImageRef.current;
        const diffImage = diffImageRef.current;
        const actualImage = actualImageRef.current;
        if (!containerElement || !expectImage || !actualImage || !diffImage || !loaded) {
            setScale(1);
            return;
        }
        const borderSize = (0, helpers_js_1.getBorderSize)(diffImage);
        if (layout == 'vertical') {
            const ratio = (diffImage.getBoundingClientRect().width - borderSize * 2) / diffImage.naturalWidth;
            setScale(Math.min(1, ratio));
        }
        if (layout == 'horizontal') {
            const ratio = 
            // NOTE: 40px because we have two margins by 20px and 6px for borders
            (containerElement.getBoundingClientRect().width - 40 - borderSize * 6) /
                [expectImage, diffImage, actualImage].map((image) => image.naturalWidth).reduce((a, b) => a + b, 0);
            setScale(Math.min(1, ratio));
        }
    }, [loaded, layout]);
    (0, helpers_js_1.useResizeObserver)(containerRef, calcScale);
    (0, react_1.useLayoutEffect)(calcScale, [calcScale]);
    (0, react_1.useLayoutEffect)(() => {
        // TODO Check image height and viewport
        const diffImage = diffImageRef.current;
        if (!diffImage || !loaded)
            return;
        const ratio = diffImage.naturalWidth / diffImage.naturalHeight;
        setLayout(ratio >= 2 ? 'vertical' : 'horizontal');
    }, [loaded]);
    (0, helpers_js_1.useApplyScale)(expectImageRef, scale);
    (0, helpers_js_1.useApplyScale)(actualImageRef, scale);
    return (react_1.default.createElement(Container, { ref: containerRef }, loaded ? (react_1.default.createElement(ImagesLayout, { layout: layout },
        react_1.default.createElement(ImageLink, { href: expect, target: "_blank", rel: "noopener noreferrer" },
            react_1.default.createElement(Image, { ref: expectImageRef, borderColor: (0, common_js_1.getBorderColor)(theme, common_js_1.themeBorderColors.expect), alt: "expect", src: expect })),
        react_1.default.createElement(ImageDiffLink, { href: diff, target: "_blank", rel: "noopener noreferrer" },
            react_1.default.createElement(DiffImage, { ref: diffImageRef, borderColor: (0, common_js_1.getBorderColor)(theme, common_js_1.themeBorderColors.diff), alt: "diff", src: diff })),
        react_1.default.createElement(ImageLink, { href: actual, target: "_blank", rel: "noopener noreferrer" },
            react_1.default.createElement(Image, { ref: actualImageRef, borderColor: (0, common_js_1.getBorderColor)(theme, common_js_1.themeBorderColors.actual), alt: "actual", src: actual })))) : (react_1.default.createElement(components_1.Loader, { size: 64 }))));
});
//# sourceMappingURL=SideBySideView.js.map