"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagesView = ImagesView;
const react_1 = __importDefault(require("react"));
const theming_1 = require("storybook/theming");
const SideBySideView_js_1 = require("./SideBySideView.js");
const SwapView_js_1 = require("./SwapView.js");
const SlideView_js_1 = require("./SlideView.js");
const BlendView_js_1 = require("./BlendView.js");
const common_js_1 = require("./common.js");
const views = {
    'side-by-side': SideBySideView_js_1.SideBySideView,
    swap: SwapView_js_1.SwapView,
    slide: SlideView_js_1.SlideView,
    blend: BlendView_js_1.BlendView,
};
const Container = theming_1.styled.div({
    height: '100%',
    display: 'flex',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
});
const ImageLink = theming_1.styled.a({
    lineHeight: 0,
});
const ActualImage = (0, theming_1.withTheme)(theming_1.styled.img(({ theme }) => {
    return {
        border: `1px solid ${(0, common_js_1.getBorderColor)(theme, common_js_1.themeBorderColors.expect)}`,
        maxWidth: '100%',
    };
}));
function normalizeUrl(image, url) {
    return url ? `${url}/${image}` : image;
}
function ImagesView({ url, image, canApprove, mode }) {
    const ViewComponent = views[mode];
    const { actual, diff, expect } = image;
    return (react_1.default.createElement(Container, null, canApprove && diff && expect ? (react_1.default.createElement(ViewComponent, { actual: normalizeUrl(actual, url), diff: normalizeUrl(diff, url), expect: normalizeUrl(expect, url) })) : (react_1.default.createElement(ImageLink, { href: normalizeUrl(actual, url), target: "_blank", rel: "noopener noreferrer" },
        react_1.default.createElement(ActualImage, { alt: "actual", src: normalizeUrl(actual, url) })))));
}
//# sourceMappingURL=ImagesView.js.map