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
exports.ResultsPage = void 0;
exports.ResultsPageInternal = ResultsPageInternal;
const react_1 = __importStar(require("react"));
const components_1 = require("storybook/internal/components");
const theming_1 = require("storybook/theming");
const ImagesView_js_1 = require("./ImagesView/ImagesView.js");
const PageHeader_js_1 = require("./PageHeader/PageHeader.js");
const PageFooter_js_1 = require("./PageFooter/PageFooter.js");
const helpers_js_1 = require("../helpers.js");
const viewMode_js_1 = require("../viewMode.js");
const CreeveyContext_js_1 = require("../../web/CreeveyContext.js");
const Wrapper = theming_1.styled.div({
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
});
const ImagesViewContainer = theming_1.styled.div(({ theme }) => ({
    background: theme.base == 'light' ? theme.color.mediumlight : theme.color.darker,
    flexGrow: 1,
    padding: '20px 0',
}));
const HeaderContainer = theming_1.styled.div({ position: 'sticky', top: 0, zIndex: 1 });
const BodyContainer = theming_1.styled.div({ flexGrow: 1, minHeight: 0 });
const FooterContainer = theming_1.styled.div({
    position: 'sticky',
    bottom: 0,
    zIndex: 1,
});
const Container = theming_1.styled.div(({ height = '100vh' }) => ({
    height,
    width: '100%',
    overflowY: 'hidden',
    display: 'flex',
    flexDirection: 'column',
}));
function ResultsPageInternal({ path, results = [], approved, theme, height, retry, imageName, onImageChange, onRetryChange, }) {
    const result = results[retry - 1] ?? {};
    const { isReport } = (0, react_1.useContext)(CreeveyContext_js_1.CreeveyContext);
    const [viewMode, setViewMode] = (0, react_1.useState)((0, viewMode_js_1.getViewMode)());
    const url = (0, helpers_js_1.getImageUrl)(path, imageName, isReport);
    const image = result.images?.[imageName];
    const canApprove = Boolean(image && approved?.[imageName] != retry - 1 && result.status != 'success');
    const hasDiffAndExpect = canApprove && Boolean(image?.diff && image.expect);
    const imagesWithError = result.images
        ? Object.keys(result.images).filter((imageName) => result.status != 'success' && approved?.[imageName] != retry - 1 && result.images?.[imageName]?.error != null)
        : [];
    const handleKeyDown = (0, react_1.useCallback)((e) => {
        if (!canApprove)
            return;
        if (e.code === 'Tab') {
            e.preventDefault();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (e.shiftKey)
                setViewMode((mode) => viewMode_js_1.viewModes.at((viewMode_js_1.viewModes.indexOf(mode) - 1) % viewMode_js_1.viewModes.length));
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            else
                setViewMode((mode) => viewMode_js_1.viewModes.at((viewMode_js_1.viewModes.indexOf(mode) + 1) % viewMode_js_1.viewModes.length));
        }
    }, [canApprove]);
    (0, react_1.useEffect)(() => {
        localStorage.setItem(viewMode_js_1.VIEW_MODE_KEY, viewMode);
    }, [viewMode]);
    (0, react_1.useEffect)(() => {
        document.addEventListener('keydown', handleKeyDown, false);
        return () => {
            document.removeEventListener('keydown', handleKeyDown, false);
        };
    }, [handleKeyDown]);
    return (react_1.default.createElement(Container, { height: height },
        react_1.default.createElement(HeaderContainer, null,
            react_1.default.createElement(PageHeader_js_1.PageHeader, { title: path, imageName: imageName, images: result.images, errorMessage: result.error, showViewModes: hasDiffAndExpect, viewMode: viewMode, onViewModeChange: setViewMode, onImageChange: onImageChange, imagesWithError: imagesWithError })),
        react_1.default.createElement(BodyContainer, null,
            react_1.default.createElement(components_1.ScrollArea, { vertical: true },
                react_1.default.createElement(Wrapper, null,
                    react_1.default.createElement(ImagesViewContainer, { theme: theme }, image ? (react_1.default.createElement(ImagesView_js_1.ImagesView, { url: url, image: image, canApprove: canApprove, mode: viewMode })) : (react_1.default.createElement(components_1.Placeholder, null, `Image ${imageName} not found`)))))),
        results.length ? (react_1.default.createElement(FooterContainer, null,
            react_1.default.createElement(PageFooter_js_1.PageFooter, { retry: retry, retriesCount: results.length, onRetryChange: onRetryChange }))) : null));
}
exports.ResultsPage = (0, theming_1.withTheme)(ResultsPageInternal);
//# sourceMappingURL=ResultsPage.js.map