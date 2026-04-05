"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeRegExp = exports.serializeRegExp = exports.isSerializedRegExp = exports.isRegExp = void 0;
const isRegExp = (exp) => {
    return exp instanceof RegExp;
};
exports.isRegExp = isRegExp;
const isSerializedRegExp = (exp) => {
    return typeof exp === 'object' && exp !== null && Reflect.get(exp, '__regexp') === true;
};
exports.isSerializedRegExp = isSerializedRegExp;
const serializeRegExp = (exp) => {
    const { source, flags } = exp;
    return {
        __regexp: true,
        source,
        flags,
    };
};
exports.serializeRegExp = serializeRegExp;
const deserializeRegExp = ({ source, flags }) => {
    return new RegExp(source, flags);
};
exports.deserializeRegExp = deserializeRegExp;
//# sourceMappingURL=serializeRegExp.js.map