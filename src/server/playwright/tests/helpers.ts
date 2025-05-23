import { StorybookEvents } from '../../../types';
import { Page } from '@playwright/test';

export async function waitForStorybookReady(page: Page, timeout = 60000): Promise<void> {
  const isStorybookInitialized = await page.evaluate(
    ({ timeout, event }: { timeout: number; event: string }) => {
      return new Promise<boolean>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = timeout / 100;
        function check() {
          if (
            typeof window.__STORYBOOK_ADDONS_CHANNEL__ !== 'undefined' &&
            window.__STORYBOOK_ADDONS_CHANNEL__.last(event) !== undefined
          ) {
            resolve(true);
          } else if (attempts++ < maxAttempts) {
            setTimeout(check, 100);
          } else {
            reject(new Error('Storybook initialization timed out. Required Storybook functions not found on window.'));
          }
        }
        check();
      });
    },
    { timeout, event: StorybookEvents.SET_GLOBALS },
  );

  if (!isStorybookInitialized) {
    throw new Error('Failed to confirm Storybook API is ready after extended wait.');
  }
}
