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
exports.SideBarHeader = SideBarHeader;
const react_1 = __importStar(require("react"));
const components_1 = require("storybook/internal/components");
const icons_1 = require("@storybook/icons");
const theming_1 = require("storybook/theming");
const CreeveyContext_js_1 = require("../../CreeveyContext.js");
const TestsStatus_js_1 = require("./TestsStatus.js");
const Search_js_1 = require("./Search.js");
const Sticky = (0, theming_1.withTheme)(theming_1.styled.div(({ theme }) => ({
    padding: '24px 36px 8px',
    background: theme.background.content,
    height: '130px',
    zIndex: 5,
    position: 'sticky',
    top: '0',
})));
const Container = theming_1.styled.div({
    display: 'flex',
    justifyContent: 'space-between',
});
const Header = theming_1.styled.h2({
    fontWeight: 'normal',
    margin: 0,
    padding: '2px 6px',
});
const Button = (0, theming_1.withTheme)((0, theming_1.styled)(components_1.Button)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    transform: 'none',
    width: '60px',
    padding: '8px 12px',
    '& svg': {
        width: '24px',
        height: '24px',
        marginRight: 0,
    },
    '&:active svg path': {
        fill: theme.color.inverseText,
    },
})));
const UpdateModeDescription = (0, theming_1.withTheme)(theming_1.styled.div(({ theme }) => ({
    fontSize: '0.8em',
    marginTop: '4px',
    padding: '2px 6px',
    color: theme.color.positive,
    backgroundColor: `${theme.color.positive}20`,
})));
const MarginContainer = theming_1.styled.div(({ left, right, top, bottom }) => ({
    marginLeft: left ?? 0,
    marginRight: right ?? 0,
    marginTop: top ?? 0,
    marginBottom: bottom ?? 0,
    padding: '2px 6px',
}));
const parseStringForFilter = (value) => {
    let status = null;
    const subStrings = [];
    const tokens = value
        .split(' ')
        .filter(Boolean)
        .map((word) => word.toLowerCase());
    tokens.forEach((word) => {
        const [, matchedStatus] = /^status:(failed|success|pending)$/i.exec(word) ?? [];
        if (matchedStatus)
            return (status = matchedStatus);
        subStrings.push(word);
    });
    return { status, subStrings };
};
function SideBarHeader({ testsStatus, onStop, onStart, filter, onFilterChange, canStart, }) {
    const { isReport, isRunning, isUpdateMode } = (0, react_1.useContext)(CreeveyContext_js_1.CreeveyContext);
    const [filterInput, setFilterInput] = (0, react_1.useState)('');
    const handleClickByStatus = (status) => {
        if (status === filter.status) {
            setFilterInput(filter.subStrings.join(' '));
            onFilterChange({ status: null, subStrings: filter.subStrings });
        }
        else {
            setFilterInput(filter.subStrings.join(' ') + ' status:' + status);
            onFilterChange({ status, subStrings: filter.subStrings });
        }
    };
    const handleInputFilterChange = (value) => {
        setFilterInput(value);
        onFilterChange(parseStringForFilter(value));
    };
    return (react_1.default.createElement(Sticky, null,
        react_1.default.createElement(Container, null,
            react_1.default.createElement("div", null,
                react_1.default.createElement(Header, null, "colin.creevey"),
                isUpdateMode && (react_1.default.createElement(UpdateModeDescription, null, "Review and approve screenshots from previous test runs")),
                react_1.default.createElement(TestsStatus_js_1.TestsStatus, { ...testsStatus, onClickByStatus: handleClickByStatus })),
            isReport || isUpdateMode ? null : (react_1.default.createElement(MarginContainer, { top: "10px" }, isRunning ? (react_1.default.createElement(Button, { variant: "outline", onClick: onStop },
                react_1.default.createElement(icons_1.StopIcon, null))) : (react_1.default.createElement(Button, { variant: "outline", onClick: onStart, disabled: !canStart },
                react_1.default.createElement(icons_1.PlayIcon, null)))))),
        react_1.default.createElement(MarginContainer, { top: "12px", bottom: "12px" },
            react_1.default.createElement(Search_js_1.Search, { onChange: handleInputFilterChange, value: filterInput }))));
}
//# sourceMappingURL=SideBarHeader.js.map