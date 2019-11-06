/// <reference types="chai" />
declare namespace Chai {
  interface ChaiStatic {
    use(fn: (chai: any, utils: ChaiUtils) => void): ChaiStatic;
  }

  interface Assertion {
    matchImage: (filename?: string) => Promise<void>;
    // TODO matchImages: () => Promise<void>;
  }
}
