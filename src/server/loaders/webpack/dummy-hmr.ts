type WebpackRequire = { m: Record<string, (...args: unknown[]) => unknown> };

declare global {
  // eslint-disable-next-line no-var
  var __CREEVEY_HMR_DATA__: { [moduleId: string]: { data: unknown; callback: (data: unknown) => void } };
}

global.__CREEVEY_HMR_DATA__ = global.__CREEVEY_HMR_DATA__ ?? {};

Object.entries((__webpack_require__ as WebpackRequire).m).forEach(([key, moduleFn]) => {
  (__webpack_require__ as WebpackRequire).m[key] = new Proxy(moduleFn, {
    apply(target, thisArg, args: [{ i: string }]) {
      const [module] = args;

      const { data } = (global.__CREEVEY_HMR_DATA__[module.i] = global.__CREEVEY_HMR_DATA__[module.i] ?? { data: {} });

      Object.assign(module, {
        hot: {
          accept(): void {
            /* noop */
          },
          get data(): unknown {
            return data;
          },
          dispose(callback: (data: unknown) => void): void {
            global.__CREEVEY_HMR_DATA__[module.i].callback = callback;
          },
        },
      });

      return target.apply(thisArg, args);
    },
  });
});

export default {};
