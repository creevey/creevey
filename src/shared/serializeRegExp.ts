export interface SerializedRegExp {
  __regexp: true;
  source: string;
  flags: string;
}

export const isRegExp = (exp: unknown): exp is RegExp => {
  return exp instanceof RegExp;
};

export const isSerializedRegExp = (exp: unknown): exp is SerializedRegExp => {
  return typeof exp === 'object' && exp !== null && Reflect.get(exp, '__regexp') === true;
};

export const serializeRegExp = (exp: RegExp): SerializedRegExp => {
  const { source, flags } = exp;
  return {
    __regexp: true,
    source,
    flags,
  };
};

export const deserializeRegExp = ({ source, flags }: SerializedRegExp): RegExp => {
  return new RegExp(source, flags);
};
