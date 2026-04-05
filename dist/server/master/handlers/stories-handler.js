"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storiesHandler = storiesHandler;
const cluster_1 = __importDefault(require("cluster"));
const messages_js_1 = require("../../messages.js");
const types_js_1 = require("../../../types.js");
const index_js_1 = require("../../../shared/index.js");
function storiesHandler({ stories }) {
    const deserializedStories = stories.map(([file, stories]) => [
        file,
        stories.map(index_js_1.deserializeStory),
    ]);
    (0, messages_js_1.emitStoriesMessage)({ type: 'update', payload: deserializedStories });
    Object.values(cluster_1.default.workers ?? {})
        .filter(types_js_1.isDefined)
        .filter((worker) => worker.isConnected())
        .forEach((worker) => {
        (0, messages_js_1.sendStoriesMessage)(worker, { type: 'update', payload: deserializedStories });
    });
}
//# sourceMappingURL=stories-handler.js.map