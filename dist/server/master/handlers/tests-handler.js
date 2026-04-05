"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testsHandler = testsHandler;
const messages_js_1 = require("../../messages.js");
function testsHandler({ tests }) {
    (0, messages_js_1.emitTestMessage)({ type: 'update', payload: tests });
}
//# sourceMappingURL=tests-handler.js.map