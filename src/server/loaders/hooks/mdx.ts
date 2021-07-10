import { addHook } from 'pirates';
import { resolveFromStorybookAddonDocs } from '../../storybook/helpers';

export const addMDXHook = async (getStory: () => string | null): Promise<void> => {
  const mdx = ((await import(resolveFromStorybookAddonDocs('@mdx-js/mdx'))) as typeof import('@mdx-js/mdx')).default;
  const { mdxOptions } = await import('../webpack/mdx-loader');
  addHook(
    (code, filename) => {
      const story = getStory();
      if (!story || !filename.startsWith(story)) return code;
      return mdx.sync(code, mdxOptions());
    },
    { exts: ['.mdx'] },
  );
};
