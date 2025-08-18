import { copyFile } from 'node:fs/promises';

await copyFile('./scripts/dist/index.d.ts', './dist/index.d.ts');
await copyFile('./scripts/dist/selenium.d.ts', './dist/selenium.d.ts');
await copyFile('./scripts/dist/playwright.d.ts', './dist/playwright.d.ts');
await copyFile('./src/server/playwright/index-source.mjs', './dist/server/playwright/index-source.mjs');
