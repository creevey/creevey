import Module from 'module';
import fs, { Dirent } from 'fs';
import { isAbsolute, join, relative, resolve } from 'path';
import { addHook } from 'pirates';
import { Config, isDefined } from '../../../types';
import { extensions } from '../../utils';
import plugin from './creevey-plugin';
import { hasDocsAddon, hasSvelteCSFAddon, isStorybookVersionLessThan } from '../../storybook/helpers';

let parents: string[] | null = null;
let story: string | null = null;

//@ts-expect-error private field doesn't have types
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
const jsLoader = Module._extensions['.js'];
//@ts-expect-error private field doesn't have types
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
Module._extensions['.js'] = function (mod: NodeModule, filename: string) {
  parents = Object.values(require.cache)
    .filter((m) => m?.children.includes(mod))
    .filter(isDefined)
    .map((m) => m.filename);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  jsLoader(mod, filename);
  parents = null;
};

addHook(() => '', {
  exts: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.eot',
    '.otf',
    '.svg',
    '.ttf',
    '.woff',
    '.woff2',
    '.css',
    '.less',
    '.scss',
    '.styl',
  ],
  ignoreNodeModules: false,
});

function getRequireContext(rootDir: string) {
  return function requireContext(rootPath: string, deep?: boolean, filter?: RegExp): __WebpackModuleApi.RequireContext {
    const ids: string[] = [];
    let contextPath: string;
    // Relative path
    if (rootPath.startsWith('.')) contextPath = resolve(rootDir, rootPath);
    // Module path
    else if (!isAbsolute(rootPath)) contextPath = require.resolve(rootPath);
    // Absolute path
    else contextPath = rootPath;
    const traverse = (dirPath: string): void => {
      fs.readdirSync(dirPath, { withFileTypes: true }).forEach((dirent: Dirent) => {
        const filename = dirent.name;
        const filePath = join(dirPath, filename);

        if (dirent.isDirectory() && deep) return traverse(filePath);
        if (dirent.isFile() && (filter?.test(`./${relative(contextPath, filePath)}`) ?? true))
          return ids.push(filePath);
      });
    };

    traverse(contextPath);

    const context = (id: string): unknown => {
      story = id;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const storyModule: unknown = require(id);
      story = null;
      return storyModule;
    };
    context.id = contextPath;
    context.keys = () => ids;
    context.resolve = (id: string) => id;

    return context;
  };
}

export default async function register(config: Config, debug = false): Promise<ReturnType<typeof getRequireContext>> {
  const rootDir = isStorybookVersionLessThan(6, 4) ? config.storybookDir : process.cwd();
  const requireContext = getRequireContext(rootDir);
  const preview = resolve(config.storybookDir, 'preview');

  if (hasDocsAddon()) await (await import('../hooks/mdx')).addMDXHook(() => story);
  if (hasSvelteCSFAddon()) await (await import('../hooks/svelte')).addSvelteHook(() => story);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  (await import('@babel/register')).default(
    config.babelOptions({
      babelrc: false,
      rootMode: 'upward-optional',
      ignore: [/node_modules/],
      extensions: [...extensions, ...(hasDocsAddon() ? ['.mdx'] : []), ...(hasSvelteCSFAddon() ? ['.svelte'] : [])],
      parserOpts: {
        sourceType: 'module',
        plugins: ['classProperties', 'decorators-legacy', 'jsx', 'typescript'],
      },
      plugins: [
        [plugin, { debug, preview, parents: () => parents, story: () => story }],
        [
          '@babel/plugin-transform-runtime',
          {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            version: (require('@babel/helpers/package.json') as { version: string }).version,
            absoluteRuntime: true,
            corejs: 3,
          },
        ],
      ],
      presets: [['@babel/preset-env', { targets: { node: '10' } }]],
    }),
  );

  return requireContext;
}
