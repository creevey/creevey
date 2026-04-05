export interface SerializedRegExp {
    __regexp: true;
    source: string;
    flags: string;
}
export declare const isRegExp: (exp: unknown) => exp is RegExp;
export declare const isSerializedRegExp: (exp: unknown) => exp is SerializedRegExp;
export declare const serializeRegExp: (exp: RegExp) => SerializedRegExp;
export declare const deserializeRegExp: ({ source, flags }: SerializedRegExp) => RegExp;
