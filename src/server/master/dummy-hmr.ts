Object.defineProperty(module.constructor.prototype, 'hot', {
  configurable: true,
  value: {
    accept() {
      /* noop */
    },
    dispose(callback: (data: unknown) => void) {
      callback({});
    },
  },
});
