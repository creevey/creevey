import { chromium } from 'playwright-core';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto('https://kontur.ru');

await page.click('#OrderForm_Fio');

await page.screenshot({ animations: 'disabled', fullPage: true, path: './kontur.png' });
