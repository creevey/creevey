"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestStatusIcon = void 0;
const react_1 = __importDefault(require("react"));
const theming_1 = require("storybook/theming");
const components_1 = require("storybook/internal/components");
const icons_1 = require("@storybook/icons");
const Container = theming_1.styled.span({
    width: '16px',
    height: '13px',
    padding: 1,
    display: 'inline-block',
});
const iconStyles = {
    position: 'relative',
    top: '1px',
    verticalAlign: 'baseline',
};
const CrossIconStyled = (0, theming_1.styled)(icons_1.CrossIcon)(iconStyles);
const CheckIconStyled = (0, theming_1.styled)(icons_1.CheckIcon)(iconStyles);
const ThumbsUpIconStyled = (0, theming_1.styled)(icons_1.ThumbsUpIcon)(iconStyles);
const AlertIconStyled = (0, theming_1.styled)(icons_1.AlertIcon)(iconStyles);
const TimeIconStyled = (0, theming_1.styled)(icons_1.TimeIcon)(iconStyles);
const CircleHollowIconStyled = (0, theming_1.styled)(icons_1.CircleHollowIcon)(iconStyles);
const Spinner = (0, theming_1.styled)(components_1.Loader)({
    top: '12px',
    left: 'unset',
    marginLeft: '0px',
});
exports.TestStatusIcon = (0, theming_1.withTheme)(({ inverted, status, skip, theme }) => {
    let icon = null;
    switch (status) {
        case 'failed': {
            icon = react_1.default.createElement(CrossIconStyled, { color: inverted ? theme.color.lightest : theme.color.negative });
            break;
        }
        case 'success': {
            icon = react_1.default.createElement(CheckIconStyled, { color: inverted ? theme.color.lightest : theme.color.green });
            break;
        }
        case 'approved': {
            icon = react_1.default.createElement(ThumbsUpIconStyled, { color: inverted ? theme.color.lightest : theme.color.mediumdark });
            break;
        }
        case 'running': {
            icon = react_1.default.createElement(Spinner, { size: 10 });
            break;
        }
        case 'pending': {
            icon = react_1.default.createElement(TimeIconStyled, { color: inverted ? theme.color.lightest : theme.color.mediumdark });
            break;
        }
        default: {
            if (skip)
                icon = react_1.default.createElement(AlertIconStyled, { color: inverted ? theme.color.lightest : undefined });
            else
                icon = react_1.default.createElement(CircleHollowIconStyled, { color: inverted ? theme.color.lightest : undefined });
            break;
        }
    }
    return react_1.default.createElement(Container, null, icon);
});
//# sourceMappingURL=TestStatusIcon.js.map