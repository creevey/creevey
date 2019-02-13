declare namespace Chai {
  interface ChaiStatic {
    use(fn: (chai: any, utils: ChaiUtils) => void): ChaiStatic;
  }

  interface Assertion {
    matchImage: (filename: string) => void;
  }

  interface ChaiUtils {
    addMethod: (prototype: any, name: string, fn: (this: Assertion, ...args: any) => void) => void;
    flag: (assertion: Assertion, key: string) => any;
  }
}
