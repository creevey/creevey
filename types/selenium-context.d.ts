import { WebDriver } from 'selenium-webdriver';

declare module 'creevey' {
  interface CreeveyTestContext {
    webdriver: WebDriver;
  }
}
