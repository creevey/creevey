"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staticHandler = staticHandler;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function staticHandler(baseDir, pathPrefix) {
    return (requestedPath) => {
        const relativePath = pathPrefix ? requestedPath.replace(pathPrefix, '') : requestedPath;
        let filePath = path_1.default.join(baseDir, relativePath || 'index.html');
        // If the path points to a directory, append index.html
        if (fs_1.default.existsSync(filePath) && fs_1.default.statSync(filePath).isDirectory()) {
            filePath = path_1.default.join(filePath, 'index.html');
        }
        return fs_1.default.existsSync(filePath) ? filePath : undefined;
    };
}
//# sourceMappingURL=static-handler.js.map