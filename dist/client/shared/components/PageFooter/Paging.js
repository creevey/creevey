"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paging = Paging;
const react_1 = __importDefault(require("react"));
const components_1 = require("storybook/internal/components");
function Paging(props) {
    const renderItem = (item, index) => {
        switch (item) {
            case '.': {
                return (react_1.default.createElement(components_1.TabButton, { disabled: true, key: `dots${index < 5 ? 'Left' : 'Right'}`, autoFocus: false, content: '', nonce: '', rel: '', rev: '' }, '...'));
            }
            default: {
                return (react_1.default.createElement(components_1.TabButton, { rel: item, rev: item, autoFocus: false, nonce: item, content: item, key: item, onClick: () => {
                        goToPage(item);
                    }, active: props.activePage === item }, item));
            }
        }
    };
    const goToPage = (pageNumber) => {
        const newPage = Number(pageNumber);
        if (1 <= newPage && pageNumber !== props.activePage && newPage <= props.pagesCount) {
            props.onPageChange(newPage);
        }
    };
    return react_1.default.createElement("div", null, getItems(props.activePage, props.pagesCount).map(renderItem));
}
function getItems(activePage, total) {
    const active = Number(activePage);
    const result = [];
    const left = Math.max(Math.min(active - 2, total - 4), 1);
    const right = Math.min(Math.max(5, active + 2), total);
    const hasLeftDots = left > 3;
    const from = hasLeftDots ? left : 1;
    const hasRightDots = right < total - 2;
    const to = hasRightDots ? right : total;
    if (hasLeftDots) {
        result.push('1', '.');
    }
    for (let i = from; i <= to; ++i) {
        result.push(`${i}`);
    }
    if (hasRightDots) {
        result.push('.');
    }
    if (hasRightDots && isFinite(total)) {
        result.push(`${total}`);
    }
    return result;
}
//# sourceMappingURL=Paging.js.map