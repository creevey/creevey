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
exports.SideBarContext = void 0;
exports.SideBar = SideBar;
const react_1 = __importStar(require("react"));
const polished_1 = require("polished");
const components_1 = require("storybook/internal/components");
const theming_1 = require("storybook/theming");
const SideBarHeader_js_1 = require("./SideBarHeader.js");
const types_js_1 = require("../../../../types.js");
const helpers_js_1 = require("../../../shared/helpers.js");
const CreeveyContext_js_1 = require("../../CreeveyContext.js");
const SuiteLink_js_1 = require("./SuiteLink.js");
const TestLink_js_1 = require("./TestLink.js");
const SideBarFooter_js_1 = require("./SideBarFooter.js");
exports.SideBarContext = (0, react_1.createContext)({
    onOpenTest: types_js_1.noop,
});
const Container = (0, theming_1.withTheme)(theming_1.styled.div(({ theme }) => ({
    width: '300px',
    boxShadow: `0 0 5px  ${(0, polished_1.transparentize)(0.8, theme.color.defaultText)}`,
    zIndex: 1000,
    background: theme.background.content,
})));
const ScrollContainer = theming_1.styled.div({
    height: 'calc(100vh - 245px)',
    width: 300,
    flex: 'none',
    overflowY: 'auto',
    position: 'sticky',
    top: '0',
    left: '0',
});
const StyledScrollArea = (0, theming_1.styled)(components_1.ScrollArea)({
    '& > [data-state="visible"]': {
        zIndex: 5,
    },
});
const Shadow = (0, theming_1.withTheme)(theming_1.styled.div(({ theme, position }) => ({
    [position]: '0px',
    position: 'sticky',
    boxShadow: `0 0 5px 2.5px ${(0, polished_1.transparentize)(0.8, theme.color.defaultText)}`,
    zIndex: 3,
})));
const SelectAllContainer = theming_1.styled.div({
    marginBottom: '30px',
    paddingTop: '9px',
});
const TestsContainer = theming_1.styled.div({
    position: 'relative',
    height: '100%',
});
const Divider = (0, theming_1.withTheme)(theming_1.styled.div(({ theme, position }) => ({
    ...(position === 'top' ? { position: 'absolute' } : { position: 'relative', bottom: '8px' }),
    height: '8px',
    width: '100%',
    zIndex: 4,
    background: theme.background.content,
})));
function SideBar({ rootSuite, testId, onOpenTest, filter, setFilter }) {
    const { onStart, onStop } = (0, CreeveyContext_js_1.useCreeveyContext)();
    // TODO Maybe need to do flatten first?
    const suite = (0, helpers_js_1.filterTests)(rootSuite, filter);
    const testsStatus = (0, helpers_js_1.countTestsStatus)(rootSuite);
    const suiteList = (0, helpers_js_1.flattenSuite)(suite);
    const countCheckedTests = (0, helpers_js_1.getCheckedTests)(rootSuite).length;
    const handleStart = () => {
        onStart(suite);
    };
    return (react_1.default.createElement(exports.SideBarContext.Provider, { value: { onOpenTest } },
        react_1.default.createElement(Container, null,
            react_1.default.createElement(SideBarHeader_js_1.SideBarHeader, { testsStatus: testsStatus, filter: filter, onFilterChange: setFilter, onStart: handleStart, onStop: onStop, canStart: countCheckedTests !== 0 }),
            react_1.default.createElement(ScrollContainer, null,
                react_1.default.createElement(StyledScrollArea, { vertical: true },
                    react_1.default.createElement(Shadow, { position: "top" }),
                    react_1.default.createElement(TestsContainer, null,
                        react_1.default.createElement(Divider, { position: "top" }),
                        react_1.default.createElement(SelectAllContainer, null,
                            react_1.default.createElement(SuiteLink_js_1.SuiteLink, { title: "Select all", suite: rootSuite, "data-testid": "selectAll" })),
                        suiteList.map(({ title, suite }) => 
                        // TODO Update components without re-mount
                        (0, types_js_1.isTest)(suite) ? (react_1.default.createElement(TestLink_js_1.TestLink, { key: suite.id, title: title, opened: suite.id == testId, test: suite })) : (react_1.default.createElement(SuiteLink_js_1.SuiteLink, { key: suite.path.join('/'), title: title, suite: suite, "data-testid": title })))),
                    react_1.default.createElement(Divider, { position: "bottom" })),
                react_1.default.createElement(Shadow, { position: "bottom" })),
            react_1.default.createElement(SideBarFooter_js_1.SideBarFooter, null))));
}
//# sourceMappingURL=SideBar.js.map