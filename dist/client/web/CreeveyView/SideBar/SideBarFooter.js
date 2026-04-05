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
exports.SideBarFooter = SideBarFooter;
const react_1 = __importStar(require("react"));
const theming_1 = require("storybook/theming");
const components_1 = require("storybook/internal/components");
const icons_1 = require("@storybook/icons");
const CreeveyContext_js_1 = require("../../CreeveyContext.js");
const Sticky = (0, theming_1.withTheme)(theming_1.styled.div(({ theme }) => ({
    padding: '24px 32px 8px',
    background: theme.background.content,
    height: '50px',
    zIndex: 5,
    position: 'sticky',
    bottom: '0',
})));
const Container = theming_1.styled.div({
    display: 'flex',
    justifyContent: 'space-between',
});
function SideBarFooter() {
    const { onApproveAll, onImageApprove, onImageNext } = (0, CreeveyContext_js_1.useCreeveyContext)();
    const [isAlt, setIsAlt] = (0, react_1.useState)(false);
    const handleKeyDown = (0, react_1.useCallback)((e) => {
        if (e.code === 'AltLeft') {
            e.preventDefault();
            setIsAlt(true);
        }
    }, []);
    const handleKeyUp = (0, react_1.useCallback)((e) => {
        if (e.code === 'AltLeft') {
            e.preventDefault();
            setIsAlt(false);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        document.addEventListener('keydown', handleKeyDown, false);
        document.addEventListener('keyup', handleKeyUp, false);
        return () => {
            document.removeEventListener('keydown', handleKeyDown, false);
            document.removeEventListener('keyup', handleKeyUp, false);
        };
    }, [handleKeyDown, handleKeyUp]);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(Sticky, null,
            react_1.default.createElement(Container, null,
                isAlt ? (react_1.default.createElement(components_1.Button, { variant: "outline", size: "medium", onClick: onImageNext, disabled: !onImageApprove },
                    "Next",
                    react_1.default.createElement(icons_1.ChevronRightIcon, null))) : (react_1.default.createElement(components_1.Button, { variant: "solid", size: "medium", onClick: onImageApprove, disabled: !onImageApprove },
                    "Approve",
                    react_1.default.createElement(icons_1.ChevronRightIcon, null))),
                react_1.default.createElement(components_1.Button, { variant: "outline", size: "medium", onClick: onApproveAll }, "Approve all")))));
}
//# sourceMappingURL=SideBarFooter.js.map