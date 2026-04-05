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
exports.SwapView = void 0;
const react_1 = __importStar(require("react"));
const components_1 = require("storybook/internal/components");
const theming_1 = require("storybook/theming");
const common_js_1 = require("./common.js");
const helpers_js_1 = require("../../helpers.js");
const Container = theming_1.styled.div({
    position: 'relative',
    display: 'flex',
});
const BaseImage = theming_1.styled.img(({ borderColor }) => ({
    boxSizing: 'border-box',
    border: `1px solid ${borderColor}`,
    maxWidth: '100%',
}));
const Image = (0, theming_1.styled)(BaseImage)({
    position: 'absolute',
});
const DiffImage = (0, theming_1.styled)(BaseImage)({
    cursor: 'pointer',
    outline: 'none',
    opacity: 0,
    zIndex: 1,
});
exports.SwapView = (0, theming_1.withTheme)(({ theme, expect, actual, diff }) => {
    const [image, setImage] = (0, react_1.useState)('actual');
    const expectImageRef = (0, react_1.useRef)(null);
    const diffImageRef = (0, react_1.useRef)(null);
    const actualImageRef = (0, react_1.useRef)(null);
    const loaded = (0, helpers_js_1.useLoadImages)(expect, diff, actual);
    const scale = (0, helpers_js_1.useCalcScale)(diffImageRef, loaded);
    (0, helpers_js_1.useApplyScale)(expectImageRef, scale, image);
    (0, helpers_js_1.useApplyScale)(actualImageRef, scale, image);
    const handleChangeView = (0, react_1.useCallback)(() => {
        setImage((prevImage) => (prevImage == 'actual' ? 'expect' : 'actual'));
    }, []);
    const handleKeyDown = (0, react_1.useCallback)((e) => {
        if (e.code === 'Space' && e.altKey) {
            e.preventDefault();
            handleChangeView();
        }
    }, [handleChangeView]);
    (0, react_1.useEffect)(() => {
        document.addEventListener('keydown', handleKeyDown, false);
        return () => {
            document.removeEventListener('keydown', handleKeyDown, false);
        };
    }, [handleKeyDown]);
    return loaded ? (react_1.default.createElement(Container, null,
        react_1.default.createElement(Image, { ref: expectImageRef, borderColor: (0, common_js_1.getBorderColor)(theme, common_js_1.themeBorderColors.expect), alt: 'expect', src: expect, hidden: image != 'expect' }),
        react_1.default.createElement(DiffImage, { ref: diffImageRef, borderColor: 'transparent', tabIndex: 0, alt: "diff", src: diff, onClick: handleChangeView }),
        react_1.default.createElement(Image, { ref: actualImageRef, borderColor: (0, common_js_1.getBorderColor)(theme, common_js_1.themeBorderColors.actual), alt: 'actual', src: actual, hidden: image != 'actual' }))) : (react_1.default.createElement(components_1.Loader, { size: 64 }));
});
//# sourceMappingURL=SwapView.js.map