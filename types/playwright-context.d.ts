import { Page } from 'playwright-core';

declare module 'creevey' {
  interface CreeveyTestContext {
    webdriver: Page;
  }
}
