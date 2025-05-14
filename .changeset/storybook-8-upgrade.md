---
'creevey': minor
---

Update Storybook to version 8.4.1

This is a minor upgrade from Storybook 7.6.20 to 8.4.1 that includes some ui changes and improvements:

**Configuration Changes:**

- Updated `.storybook/main.ts` to support `.mdx` files instead of `.md` files for documentation
- Removed deprecated addons: `@storybook/addon-links` and `@storybook/addon-onboarding`
- Added new `@chromatic-com/storybook` addon for visual testing integration
- Added `chromatic.config.json` for Chromatic configuration

**API Changes:**

- Updated icon imports from `@storybook/components` to `@storybook/icons` for better tree-shaking
- Changed API imports from `@storybook/api` to `@storybook/manager-api`
- Updated testing library imports from `@storybook/testing-library` to `@storybook/test`
- Button component props updated from `outline small` to `size="small" variant="outline"`

**New Dependencies:**

- Added `@storybook/icons` for optimized icon components
- Added `@storybook/blocks` for enhanced documentation blocks
- Added `@chromatic-com/storybook` for Chromatic integration

**Component Updates:**

- Replaced generic `Icons` component usage with specific icon components throughout the UI
- Updated async event handling in stories with proper `await` syntax
- Simplified styling by removing unnecessary custom styled components

This upgrade provides better performance, improved TypeScript support, and aligns with modern Storybook best practices.
