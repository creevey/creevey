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
const react_1 = __importStar(require("react"));
const client_1 = require("react-dom/client");
const CreeveyApp_js_1 = require("./CreeveyApp.js");
const creeveyClientApi_js_1 = require("../shared/creeveyClientApi.js");
const helpers_js_1 = require("../shared/helpers.js");
const CreeveyLoader_js_1 = require("./CreeveyLoader.js");
function loadCreeveyData() {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'data.js';
        script.onload = () => {
            resolve(__CREEVEY_DATA__);
        };
        document.body.appendChild(script);
    });
}
const CreeveyAppAsync = (0, react_1.lazy)(async () => {
    let isReport = false;
    let creeveyStatus;
    let creeveyApi;
    if (window.location.host) {
        try {
            creeveyApi = await (0, creeveyClientApi_js_1.initCreeveyClientApi)();
            creeveyStatus = await creeveyApi.status;
        }
        catch {
            // NOTE: Failed to get status from API
            // NOTE: It might happen on circle ci from artifact
            isReport = true;
            creeveyStatus = { isRunning: false, tests: await loadCreeveyData(), browsers: [], isUpdateMode: false };
        }
    }
    else {
        isReport = true;
        creeveyStatus = { isRunning: false, tests: await loadCreeveyData(), browsers: [], isUpdateMode: false };
    }
    return {
        default() {
            return (react_1.default.createElement(CreeveyApp_js_1.CreeveyApp, { api: creeveyApi, initialState: {
                    isReport,
                    isRunning: creeveyStatus.isRunning,
                    tests: (0, helpers_js_1.treeifyTests)(creeveyStatus.tests),
                    isUpdateMode: creeveyStatus.isUpdateMode,
                } }));
        },
    };
});
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = (0, client_1.createRoot)(document.getElementById('root'));
root.render(react_1.default.createElement(react_1.Suspense, { fallback: react_1.default.createElement(CreeveyLoader_js_1.CreeveyLoader, null) },
    react_1.default.createElement(CreeveyAppAsync, null)));
//# sourceMappingURL=index.js.map