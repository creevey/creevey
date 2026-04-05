"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = exports.story = exports.kind = void 0;
exports.default = parse;
const url_1 = require("url");
const utils_js_1 = require("../utils.js");
// NOTE: Copy-pasted from @storybook/csf
function toStartCaseStr(str) {
    return str
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\./g, ' ')
        .replace(/([^\n])([A-Z])([a-z])/g, (_, $1, $2, $3) => `${$1} ${$2}${$3}`)
        .replace(/([a-z])([A-Z])/g, (_, $1, $2) => `${$1} ${$2}`)
        .replace(/([a-z])([0-9])/gi, (_, $1, $2) => `${$1} ${$2}`)
        .replace(/([0-9])([a-z])/gi, (_, $1, $2) => `${$1} ${$2}`)
        .replace(/(\s|^)(\w)/g, (_, $1, $2) => `${$1}${$2.toUpperCase()}`)
        .replace(/ +/g, ' ')
        .trim();
}
/**
 * Remove punctuation and illegal characters from a story ID.
 *
 * See https://gist.github.com/davidjrice/9d2af51100e41c6c4b4a
 */
const sanitize = (string) => {
    return (string
        .toLowerCase()
        // eslint-disable-next-line no-useless-escape
        .replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, ''));
};
const sanitizeSafe = (string, part) => {
    const sanitized = sanitize(string);
    if (sanitized === '') {
        throw new Error(`Invalid ${part} '${string}', must include alphanumeric characters`);
    }
    return sanitized;
};
/**
 * Generate a storybook ID from a component/kind and story name.
 */
const toId = (kind, name) => `${sanitizeSafe(kind, 'kind')}${name ? `--${sanitizeSafe(name, 'name')}` : ''}`;
/**
 * Transform a CSF named export into a readable story name
 */
const storyNameFromExport = (key) => toStartCaseStr(key);
async function parse(files) {
    result = {};
    await (0, utils_js_1.loadThroughTSX)(async (load) => Promise.all(files.map(async (file) => {
        const fileUrl = (0, url_1.pathToFileURL)(file).toString();
        await load(fileUrl);
    })));
    return result;
}
let result = {};
let kindTitle = '';
let storyTitle = '';
let storyParams = null;
const setStoryParameters = (params) => {
    storyParams = params;
};
const getStoryId = (kindTitle, storyTitle) => {
    return toId(kindTitle, storyNameFromExport(storyTitle));
};
const kind = (title, kindFn) => {
    kindTitle = title;
    kindFn();
    kindTitle = '';
};
exports.kind = kind;
const story = (title, storyFn) => {
    storyTitle = title;
    storyParams = null;
    storyFn({ setStoryParameters });
    const storyId = getStoryId(kindTitle, storyTitle);
    result[storyId] = Object.assign({}, storyParams, { tests: result[storyId]?.tests });
    storyTitle = '';
    storyParams = null;
};
exports.story = story;
const test = (title, testFn) => {
    const storyId = getStoryId(kindTitle, storyTitle);
    result[storyId] ??= {};
    result[storyId].tests = Object.assign({}, result[storyId].tests, { [title]: testFn });
};
exports.test = test;
//# sourceMappingURL=parser.js.map