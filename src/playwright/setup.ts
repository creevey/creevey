import path from 'path';
import assert from 'assert';
import { mkdir, writeFile } from 'fs/promises';
import { chromium, firefox, webkit, Page, FullConfig } from '@playwright/test';
import { StoriesRaw } from '../types';
import { getCreeveyCache } from '../server/utils';
import { appendIframePath } from '../server/webdriver';
import { waitForStorybookReady } from './helpers';

// This function will fetch stories and cache them or an error if fetching fails.
// It's intended to be called once before tests that depend on stories are defined.
async function ensureStoriesFetched(page: Page, storybookUrl: string): Promise<StoriesRaw> {
  try {
    console.log(`Fetching stories from: ${storybookUrl}`);

    await page.goto(appendIframePath(storybookUrl), { waitUntil: 'networkidle', timeout: 60000 });
    await waitForStorybookReady(page);

    // TODO: Inline `serializeRawStories` to serialize creevey skip parameters
    const fetchedStories = await page.evaluate<StoriesRaw | undefined>(() => window.__STORYBOOK_PREVIEW__.extract());

    if (!fetchedStories || Object.keys(fetchedStories).length === 0) {
      throw new Error('No stories were found or cached from Storybook.');
    }
    console.log(`Successfully fetched and cached ${Object.keys(fetchedStories).length} stories.`);

    return fetchedStories;
  } catch (error: unknown) {
    console.error('Error fetching stories');
    throw error;
  }
}

const browsers = {
  chromium,
  firefox,
  webkit,
};

// TODO: Setup should generate test files for each story file (component)
// TODO: Add support for multiple storybook urls
async function globalSetup(config: FullConfig) {
  const storybookUrl = config.webServer?.url;
  const { defaultBrowserType = 'chromium', browserName = defaultBrowserType } = config.projects[0].use;

  assert(storybookUrl, 'Storybook URL is required');

  const cacheDir = await getCreeveyCache();
  assert(cacheDir, 'Cache directory not found');

  await mkdir(cacheDir, { recursive: true });

  process.env.CREEVEY_CACHE_DIR = cacheDir;

  const browser = await browsers[browserName].launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  if (process.env.PWDEBUG) {
    await context.tracing.start({ name: 'storybook-setup' });
  }

  try {
    const stories = await ensureStoriesFetched(page, storybookUrl);

    await writeFile(path.join(cacheDir, 'stories.json'), JSON.stringify(stories, null, 2));
  } catch (error) {
    console.error('Error in globalSetup:', error);

    if (process.env.PWDEBUG) {
      const tracePath = path.join(cacheDir, 'storybook-setup-trace.zip');

      console.log('Trace is saved to:', tracePath);

      await context.tracing.stop({ path: tracePath });
    }

    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
