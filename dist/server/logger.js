"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.setRootName = exports.colors = void 0;
const chalk_1 = __importDefault(require("chalk"));
const loglevel_1 = __importDefault(require("loglevel"));
const loglevel_plugin_prefix_1 = __importDefault(require("loglevel-plugin-prefix"));
exports.colors = {
    TRACE: chalk_1.default.magenta,
    DEBUG: chalk_1.default.cyan,
    INFO: chalk_1.default.blue,
    WARN: chalk_1.default.yellow,
    ERROR: chalk_1.default.red,
};
let rootName = 'Creevey';
loglevel_plugin_prefix_1.default.reg(loglevel_1.default);
loglevel_plugin_prefix_1.default.apply(loglevel_1.default, {
    format(level, name = rootName) {
        const levelColor = exports.colors[level.toUpperCase()];
        return `[${name}:${chalk_1.default.gray(process.pid)}] ${levelColor(level.padEnd(5))} =>`;
    },
});
const setRootName = (newName) => (rootName = newName);
exports.setRootName = setRootName;
const logger = () => loglevel_1.default.getLogger(rootName);
exports.logger = logger;
//# sourceMappingURL=logger.js.map