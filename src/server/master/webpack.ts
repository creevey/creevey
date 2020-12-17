import { rmdirSync } from 'fs';
import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import { extensions as fallbackExtensions, getCreeveyCache } from '../utils';
import { Config, Options, noop } from '../../types';
import loadStorybookWebpackConfig from '@storybook/core/dist/server/config';
import { emitWebpackMessage, subscribeOn } from '../messages';

let isInitiated = false;
const supportedFrameworks = [
  'react',
  'vue',
  'angular',
  'marionette',
  'mithril',
  'marko',
  'html',
  'svelte',
  'riot',
  'ember',
  'preact',
  'rax',
  'aurelia',
  'server',
  'web-components',
];

function tryDetectStorybookFramework(parentDir: string): string | undefined {
  return supportedFrameworks.find((framework) => {
    try {
      return require.resolve(path.join(parentDir, `@storybook/${framework}`));
    } catch (_) {
      return false;
    }
  });
}

// TODO Output summary of success builds
// TODO Don't fail on failed build
function handleWebpackBuild(error: Error, stats: webpack.Stats): void {
  if (error || !stats || stats.hasErrors()) {
    emitWebpackMessage({ type: isInitiated ? 'rebuild failed' : 'fail' });
    console.error('=> Failed to build the preview'); // TODO Change message

    if (error) return console.error(error.message);
    if (stats && (stats.hasErrors() || stats.hasWarnings())) {
      const { warnings, errors } = stats.toJson();

      errors.forEach((e) => console.error(e));
      warnings.forEach((e) => console.error(e));

      return;
    }
  }
  stats.toJson().warnings.forEach((e) => console.warn(e));

  if (!isInitiated) {
    isInitiated = true;
    emitWebpackMessage({ type: 'success' });
  } else {
    emitWebpackMessage({ type: 'rebuild succeeded' });
  }

  return;
}

export default async function compile(config: Config, { debug, ui }: Options): Promise<void> {
  const storybookCorePath = require.resolve('@storybook/core');
  const [storybookParentDirectory] = storybookCorePath.split('@storybook');
  const storybookFramework = tryDetectStorybookFramework(storybookParentDirectory);

  if (!storybookFramework)
    throw new Error(
      "Couldn't detect used Storybook framework. Please ensure that you install `@storybook/<framework>` package",
    );

  const { default: storybookFrameworkOptions } = (await import(
    `@storybook/${storybookFramework}/dist/server/options`
  )) as { default: { framework: string; frameworkPresets: string[] } };

  const outputDir = path.join(getCreeveyCache(), 'storybook');

  try {
    rmdirSync(outputDir, { recursive: true });
  } catch (_) {
    /* noop */
  }

  // TODO Add quite
  const storybookWebpackConfig = await loadStorybookWebpackConfig({
    configType: 'PRODUCTION',
    outputDir,
    cache: {},
    corePresets: [require.resolve('@storybook/core/dist/server/preview/preview-preset')],
    overridePresets: [require.resolve('@storybook/core/dist/server/preview/custom-webpack-preset')],
    ...storybookFrameworkOptions,
    configDir: config.storybookDir,
  });

  const extensions = storybookWebpackConfig.resolve?.extensions ?? fallbackExtensions;

  delete storybookWebpackConfig.optimization;
  delete storybookWebpackConfig.devtool;
  storybookWebpackConfig.performance = false;
  storybookWebpackConfig.mode = 'development';
  storybookWebpackConfig.target = 'node';
  storybookWebpackConfig.output = {
    ...storybookWebpackConfig.output,
    filename: 'main.js',
  };

  // NOTE Exclude all addons
  storybookWebpackConfig.entry = Array.isArray(storybookWebpackConfig.entry)
    ? storybookWebpackConfig.entry.filter((entry) => !/@storybook(\/|\\)addon/.test(entry))
    : storybookWebpackConfig.entry;

  // NOTE Add hack to allow stories HMR work in nodejs
  Array.isArray(storybookWebpackConfig.entry) &&
    storybookWebpackConfig.entry.unshift(path.join(__dirname, 'dummy-hmr'));

  // NOTE replace mdx to null loader for now
  // TODO Use creevey-loader instead
  storybookWebpackConfig.module?.rules
    .filter(
      (rule) =>
        rule.test?.toString() == /\.mdx$/.toString() || rule.test?.toString() == /\.(stories|story)\.mdx$/.toString(),
    )
    .forEach((rule) => (rule.use = require.resolve('null-loader')));

  // NOTE Exclude source-loader
  storybookWebpackConfig.module = {
    ...storybookWebpackConfig.module,
    rules:
      storybookWebpackConfig.module?.rules.filter(
        (rule) => !(typeof rule.loader == 'string' && /@storybook(\/|\\)source-loader/.test(rule.loader)),
      ) ?? [],
  };

  // NOTE Add creevey-loader to cut off all unnecessary code except stories meta and tests
  // TODO Apply only for stories and preview.js
  storybookWebpackConfig.module?.rules.unshift({
    enforce: 'pre',
    test: new RegExp(`\\.(${extensions.map((x) => x.slice(1))?.join('|')})$`),
    exclude: /node_modules/,
    use: { loader: require.resolve('./loader'), options: { debug } },
  });

  // NOTE Exclude from bundle all modules from node_modules
  storybookWebpackConfig.externals = [
    // NOTE Replace `@storybook/${framework}` to ../storybook.ts
    { [`@storybook/${storybookFramework}`]: `commonjs ${require.resolve('../storybook')}` },
    nodeExternals({
      includeAbsolutePaths: true,
      allowlist: /(webpack|dummy-hmr|generated-stories-entry|generated-config-entry|generated-other-entry)/,
    }),
    // TODO Don't work well with monorepos
    nodeExternals({
      modulesDir: storybookParentDirectory,
      includeAbsolutePaths: true,
      allowlist: /(webpack|dummy-hmr|generated-stories-entry|generated-config-entry|generated-other-entry)/,
    }),
  ];

  const storybookWebpackCompiler = webpack(storybookWebpackConfig);
  if (ui) {
    const watcher = storybookWebpackCompiler.watch({}, handleWebpackBuild);

    subscribeOn('shutdown', () => watcher.close(noop));
  } else {
    storybookWebpackCompiler.run(handleWebpackBuild);
  }
}
