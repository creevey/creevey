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
exports.PageHeader = PageHeader;
const react_1 = __importStar(require("react"));
const components_1 = require("storybook/internal/components");
const icons_1 = require("@storybook/icons");
const theming_1 = require("storybook/theming");
const helpers_js_1 = require("../../helpers.js");
const ImagePreview_js_1 = require("./ImagePreview.js");
const viewMode_js_1 = require("../../viewMode.js");
const CreeveyContext_js_1 = require("../../../web/CreeveyContext.js");
const Container = theming_1.styled.div({
    marginTop: '24px',
});
const ErrorContainer = (0, theming_1.withTheme)(theming_1.styled.div(({ theme }) => ({
    marginTop: '8px',
    padding: '8px',
    background: `${theme.background.negative}20`,
    color: theme.color.negative,
    borderRadius: '2px',
    display: 'flex',
    alignItems: 'baseline',
    '& svg': {
        margin: '0 5px',
        width: 8,
        height: 8,
    },
    '& pre': {
        margin: '0 4px',
        padding: 0,
        lineHeight: '22px',
    },
})));
const UpdateModeBanner = (0, theming_1.withTheme)(theming_1.styled.div(({ theme }) => ({
    padding: '8px 32px',
    backgroundColor: `${theme.color.positive}20`,
    color: theme.color.positive,
    fontSize: '12px',
    textAlign: 'center',
    fontWeight: 'bold',
})));
const H1 = theming_1.styled.h1({
    marginLeft: '44px',
    marginBottom: '8px',
});
const HeaderDivider = (0, theming_1.withTheme)(theming_1.styled.span(({ theme }) => ({
    padding: '0 8px',
    color: theme.color.mediumdark,
})));
const ImagesEntriesContainer = theming_1.styled.div({
    display: 'flex',
    margin: '16px 0 8px',
});
// TODO Move images to sidebar
function PageHeader({ title, imageName, images = {}, errorMessage, showViewModes, viewMode, imagesWithError = [], onImageChange, onViewModeChange, }) {
    const { isReport, isUpdateMode } = (0, react_1.useContext)(CreeveyContext_js_1.CreeveyContext);
    const imageEntires = Object.entries(images);
    const handleViewModeChange = (mode) => {
        onViewModeChange(mode);
    };
    (0, react_1.useEffect)(() => {
        if (imageName === '') {
            if (imagesWithError.length > 0) {
                onImageChange(imagesWithError[0]);
                return;
            }
            const firstImage = Object.keys(images).at(0);
            if (firstImage)
                onImageChange(firstImage);
        }
    }, [imageName, images, imagesWithError, onImageChange]);
    const error = errorMessage || imagesWithError.includes(imageName) ? (images[imageName]?.error ?? errorMessage) : null;
    return (react_1.default.createElement(Container, null,
        react_1.default.createElement(H1, null, title.flatMap((token) => [token, react_1.default.createElement(HeaderDivider, { key: token }, "/")]).slice(0, -1)),
        error && (react_1.default.createElement(ErrorContainer, null,
            react_1.default.createElement(icons_1.CloseAltIcon, null),
            react_1.default.createElement("pre", null, error))),
        imageEntires.length > 1 ? (react_1.default.createElement(ImagesEntriesContainer, null, imageEntires.map(([name, image]) => (react_1.default.createElement(ImagePreview_js_1.ImagePreview, { key: name, imageName: name, url: `${(0, helpers_js_1.getImageUrl)(title, name, isReport)}/${image.actual}`, isActive: name === imageName, onClick: onImageChange, error: imagesWithError.includes(name) }))))) : null,
        isUpdateMode && (react_1.default.createElement(UpdateModeBanner, null, "Update Mode: Review and approve screenshots from previous test runs")),
        showViewModes && (react_1.default.createElement(components_1.Tabs, { selected: viewMode, actions: { onSelect: handleViewModeChange } }, viewMode_js_1.viewModes.map((x) => (react_1.default.createElement("div", { key: x, id: x, title: x })))))));
}
//# sourceMappingURL=PageHeader.js.map