import { addHook } from 'pirates';
import { getTsconfig } from 'get-tsconfig';

import { Config } from '../../types';

export default async function register(config: Config): Promise<void> {
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

  const { path: tsConfigPath } = getTsconfig(config.tsConfig) || {};

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  (await import('@babel/register')).default(
    config.babelOptions({
      babelrc: false,
      rootMode: 'upward-optional',
      ignore: [/node_modules/],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      parserOpts: {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      },
      presets: ['@babel/preset-typescript', ['@babel/preset-env', { targets: { node: '10' }, modules: 'commonjs' }]],
      plugins: [
        ['@babel/plugin-transform-runtime'],
        ...(tsConfigPath ? [['babel-plugin-tsconfig-paths', { tsconfig: tsConfigPath }]] : []),
      ],
    }),
  );

  // (await import('ts-node')).register({ project: tsConfigPath, transpileOnly: true });
}
