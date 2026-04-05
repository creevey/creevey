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
exports.WorkerOptionsSchema = exports.OptionsSchema = void 0;
const v = __importStar(require("valibot"));
exports.OptionsSchema = v.object({
    ui: v.optional(v.boolean()),
    storybookStart: v.optional(v.union([v.string(), v.boolean()])),
    config: v.optional(v.string()),
    debug: v.optional(v.boolean()),
    port: v.number(),
    failFast: v.optional(v.boolean()),
    reportDir: v.optional(v.string()),
    screenDir: v.optional(v.string()),
    storybookUrl: v.optional(v.string()),
    storybookPort: v.optional(v.number()),
    reporter: v.optional(v.string()),
    odiff: v.optional(v.boolean()),
    trace: v.optional(v.boolean()),
    docker: v.optional(v.boolean()),
});
exports.WorkerOptionsSchema = v.object({
    browser: v.string(),
    storybookUrl: v.string(),
    gridUrl: v.optional(v.string()),
    config: v.optional(v.string()),
    debug: v.optional(v.boolean()),
    trace: v.optional(v.boolean()),
    reportDir: v.optional(v.string()),
    screenDir: v.optional(v.string()),
    odiff: v.optional(v.boolean()),
    port: v.number(),
});
//# sourceMappingURL=schema.js.map