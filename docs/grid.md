## Use your Selenium Grid (LambdaTest/BrowserStack/SauceLabs/etc)

Sometimes you already have Selenium Grid on one of many different e2e testing services, like LambdaTest, BrowserStack, or SauceLabs , or use a self-hosted one. You could use these services. If your Selenium Grid is located in the same network where you going to start Creevey, you will need to define `gridUrl` parameter in Creevey config. Overwise you need to start tunneling tool depending on what Grid you use:

- [LambdaTest](https://www.npmjs.com/package/@lambdatest/node-tunnel)
- [browserstack-local](https://www.npmjs.com/package/browserstack-local)
- [sauce-connect-launcher](https://www.npmjs.com/package/sauce-connect-launcher)
- [open-ssh-tunnel](https://www.npmjs.com/package/open-ssh-tunnel)

To start one of these tool use `before/after` hook parameters in Creevey config.

## Idle sessions and billing

Creevey does **not** hold Selenium sessions open while idle. When running in UI mode, each worker's session is reaped by the grid after the grid's own idle timeout (Selenoid ~60s, Selenium Grid 4 ~300s, vendors vary). When you trigger a run after idle, Creevey transparently recreates the session and continues — you will see a short delay on the first test after inactivity, then tests run normally.

For services that bill by session running time, this means you are only billed for active test runs plus the short idle-timeout window. To maximize savings, keep your grid's idle/session timeout modest (e.g. set `sessionTimeout` via `seleniumCapabilities` or your grid config). Creevey recovers regardless of the timeout value.
