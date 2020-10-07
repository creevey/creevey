/// <reference types="chai" />
declare namespace Chai {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ChaiStatic {
    use(fn: (chai: ChaiStatic, utils: ChaiUtils) => void): ChaiStatic;
  }

  interface Assertion {
    matchImage: (filename?: string) => Promise<void>;
    matchImages: () => Promise<void>;
  }
}
