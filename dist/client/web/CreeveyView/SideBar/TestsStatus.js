"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestsStatus = void 0;
const react_1 = __importDefault(require("react"));
const components_1 = require("storybook/internal/components");
const icons_1 = require("@storybook/icons");
const theming_1 = require("storybook/theming");
const Container = theming_1.styled.div({
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    lineHeight: '22px',
    padding: '2px 6px',
});
const IconContainer = theming_1.styled.div(({ color }) => ({
    color: color ?? 'inherit',
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    margin: '0 4px',
    '&:first-of-type': {
        marginLeft: 0,
    },
    '& svg': {
        marginRight: 5,
        width: 10,
        height: 10,
    },
}));
const Divider = theming_1.styled.div({
    '&::before': {
        content: "'/'",
        display: 'block',
        marginRight: 4,
    },
});
const Button = (0, theming_1.styled)(components_1.IconButton)({
    marginTop: 0,
    padding: 0,
    height: '24px',
});
exports.TestsStatus = (0, theming_1.withTheme)(({ successCount, failedCount, pendingCount, approvedCount, onClickByStatus, theme, }) => {
    return (react_1.default.createElement(Container, null,
        react_1.default.createElement(Button, { onClick: () => {
                onClickByStatus('pending');
            } },
            react_1.default.createElement(IconContainer, { color: theme?.color.mediumdark },
                react_1.default.createElement(icons_1.TimeIcon, null),
                pendingCount)),
        react_1.default.createElement(Divider, null),
        react_1.default.createElement(Button, { onClick: () => {
                onClickByStatus('success');
            } },
            react_1.default.createElement(IconContainer, { color: theme?.color.green },
                react_1.default.createElement(icons_1.CheckIcon, null),
                " ",
                successCount)),
        react_1.default.createElement(Divider, null),
        react_1.default.createElement(Button, { onClick: () => {
                onClickByStatus('failed');
            } },
            react_1.default.createElement(IconContainer, { color: theme?.color.negative },
                react_1.default.createElement(icons_1.CrossIcon, null),
                " ",
                failedCount)),
        react_1.default.createElement(Divider, null),
        react_1.default.createElement(Button, { onClick: () => {
                onClickByStatus('approved');
            } },
            react_1.default.createElement(IconContainer, { color: theme?.color.defaultText },
                react_1.default.createElement(icons_1.ThumbsUpIcon, null),
                " ",
                approvedCount))));
});
//# sourceMappingURL=TestsStatus.js.map