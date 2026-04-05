"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageFooter = PageFooter;
const react_1 = __importDefault(require("react"));
const theming_1 = require("storybook/theming");
const Paging_js_1 = require("./Paging.js");
const Container = (0, theming_1.withTheme)(theming_1.styled.div(({ theme }) => ({
    display: 'flex',
    padding: '24px 32px 20px',
    justifyContent: 'space-between',
    background: theme.background.content,
})));
function PageFooter({ retriesCount, retry, onRetryChange }) {
    return (react_1.default.createElement(Container, null,
        react_1.default.createElement(Paging_js_1.Paging, { activePage: `${retry}`, onPageChange: onRetryChange, pagesCount: retriesCount })));
}
//# sourceMappingURL=PageFooter.js.map