import { addHook } from 'pirates';
import { logger } from '../../logger.js';
import { resolveFromStorybook, storybookConfigRef } from '../../storybook/helpers.js';

export const addSvelteHook = async (getStory: () => string | null): Promise<void> => {
  const { compile, preprocess } = (await import(resolveFromStorybook('svelte/compiler'))) as {
    compile: (code: string, options: Record<string, unknown>) => { js: { code: string }; warnings: string[] };
    preprocess: (
      code: string,
      preprocessor: Record<string, unknown>,
      options: { filename: string },
    ) => { code: string };
  };
  const { default: svelteCSFLoader } = (await import(
    resolveFromStorybook('@storybook/addon-svelte-csf/dist/cjs/parser/svelte-stories-loader')
  )) as {
    default: (code: string) => string;
  };
  addHook(
    (code, filename) => {
      const story = getStory();
      const config = storybookConfigRef.current;
      const { svelteOptions: options = {} } = config as {
        svelteOptions?: {
          compilerOptions?: Record<string, unknown>;
          preprocess?: Record<string, unknown>;
        };
      };
      // NOTE: Copy-paste compiling code from https://github.com/sveltejs/svelte-loader/blob/3c4d66d/index.js
      const compileOptions = {
        filename,
        css: false,
        ...options.compilerOptions,
        format: options.compilerOptions?.format || 'esm',
      };

      // TODO Can't use preprocess here because it async and hook must be sync
      // The only way to fix it, load stories by using `import()` instead of require
      // And write native nodejs `.svelte` resolver https://nodejs.org/api/esm.html#esm_resolve_specifier_context_defaultresolve
      // const processed = await preprocess(code, options.preprocess, { filename });
      void preprocess;

      const {
        js: { code: compiledCode },
        warnings,
      } = compile(code, compileOptions);

      warnings.forEach((warning) => logger.warn(warning));

      if (!story || !filename.startsWith(story)) return compiledCode;
      return svelteCSFLoader.call({ _module: { resource: filename } }, compiledCode);

      // TODO Extract parameters from `create_fragment` that created by compiler
      // TODO Write babel transformation for it
    },
    { exts: ['.svelte'] },
  );
};
