"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getViewMode = exports.viewModes = exports.VIEW_MODE_KEY = void 0;
exports.VIEW_MODE_KEY = 'Creevey_view_mode';
exports.viewModes = ['side-by-side', 'swap', 'slide', 'blend'];
const getViewMode = () => {
    const item = localStorage.getItem(exports.VIEW_MODE_KEY);
    return item && exports.viewModes.includes(item) ? item : 'side-by-side';
};
exports.getViewMode = getViewMode;
//# sourceMappingURL=viewMode.js.map