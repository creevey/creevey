import { rmdirSync, writeFile } from 'fs';
import path from 'path';
import webpack, { Configuration } from 'webpack';
import nodeExternals from 'webpack-node-externals';
import { extensions as fallbackExtensions, getCreeveyCache, isStorybookVersionLessThan } from '../utils';
import { Config, Options, noop } from '../../types';
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

function handleWebpackBuild(error: Error, stats: webpack.Stats): void {
  if (error || !stats || stats.hasErrors()) {
    emitWebpackMessage({ type: isInitiated ? 'rebuild failed' : 'fail' });
    console.error('=> Failed to build the Storybook preview bundle');

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

async function getWebpackConfigForStorybook_pre6_2(
  framework: string,
  configDir: string,
  outputDir: string,
): Promise<Configuration> {
  const { default: storybookFrameworkOptions } = (await import(`@storybook/${framework}/dist/server/options`)) as {
    default: { framework: string; frameworkPresets: string[] };
  };

  const { default: loadStorybookWebpackConfig } = await import('@storybook/core/dist/server/config');

  return loadStorybookWebpackConfig({
    // @ts-expect-error: 6.1 storybook don't support quite any more. But we still have older versions
    quiet: true,
    configType: 'PRODUCTION',
    outputDir,
    cache: {},
    corePresets: [require.resolve('@storybook/core/dist/server/preview/preview-preset')],
    overridePresets: [require.resolve('@storybook/core/dist/server/preview/custom-webpack-preset')],
    ...storybookFrameworkOptions,
    configDir,
  });
}

async function getWebpackConfigForStorybook_6_2(
  framework: string,
  configDir: string,
  outputDir: string,
): Promise<Configuration> {
  const { default: storybookFrameworkOptions } = (await import(`@storybook/${framework}/dist/cjs/server/options`)) as {
    default: { framework: string; frameworkPresets: string[] };
  };
  // TODO Remove addons by requiring main.js and monkey patch
  // TODO Find where storybook load main.js

  const options = {
    quiet: true,
    configType: 'PRODUCTION',
    outputDir,
    configDir,
    ...storybookFrameworkOptions,
  };

  // TODO Annotate types

  //@ts-expect-error missing import
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, node/no-missing-import
  const { getPreviewBuilder } = await import('@storybook/core-server/dist/cjs/utils/get-preview-builder');
  //@ts-expect-error missing import
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, node/no-missing-import
  const { loadAllPresets } = await import('@storybook/core-common');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const builder = await getPreviewBuilder(configDir);

  // NOTE: Copy-paste from storybook/lib/core-server/src/build-dev.ts
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const presets = loadAllPresets({
    corePresets: [
      // eslint-disable-next-line node/no-missing-require
      require.resolve('@storybook/core-server/dist/cjs/presets/common-preset'),
      // // eslint-disable-next-line node/no-missing-require
      // require.resolve('@storybook/core-server/dist/cjs/presets/manager-preset'),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      ...builder.corePresets,
      // eslint-disable-next-line node/no-missing-require
      require.resolve('@storybook/core-server/dist/cjs/presets/babel-cache-preset'),
    ],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    overridePresets: builder.overridePresets,
    ...options,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  return builder.getConfig({ ...options, presets });
}

export default async function compile(config: Config, { debug, ui }: Options): Promise<void> {
  const storybookCorePath = require.resolve('@storybook/core');
  const [storybookParentDirectory] = storybookCorePath.split('@storybook');
  const storybookFramework = tryDetectStorybookFramework(storybookParentDirectory);

  if (!storybookFramework)
    throw new Error(
      "Couldn't detect used Storybook framework. Please ensure that you install `@storybook/<framework>` package",
    );

  const outputDir = path.join(getCreeveyCache(), 'storybook');

  try {
    rmdirSync(outputDir, { recursive: true });
  } catch (_) {
    /* noop */
  }

  const getWebpackConfig = isStorybookVersionLessThan(6, 2)
    ? getWebpackConfigForStorybook_pre6_2
    : getWebpackConfigForStorybook_6_2;

  const storybookWebpackConfig = await getWebpackConfig(storybookFramework, config.storybookDir, outputDir);

  const extensions = storybookWebpackConfig.resolve?.extensions ?? fallbackExtensions;

  delete storybookWebpackConfig.optimization;
  storybookWebpackConfig.devtool = false;
  storybookWebpackConfig.performance = false;
  storybookWebpackConfig.profile = debug;
  storybookWebpackConfig.mode = 'development';
  storybookWebpackConfig.target = 'node';
  storybookWebpackConfig.output = {
    ...storybookWebpackConfig.output,
    filename: 'main.js',
  };

  // TODO Need to exclude third-party addons
  // NOTE Exclude all addons
  storybookWebpackConfig.entry = Array.isArray(storybookWebpackConfig.entry)
    ? storybookWebpackConfig.entry.filter((entry) => !/@storybook(\/|\\)addon/.test(entry))
    : storybookWebpackConfig.entry;

  // NOTE Add hack to allow stories HMR work in nodejs
  Array.isArray(storybookWebpackConfig.entry) &&
    storybookWebpackConfig.entry.unshift(path.join(__dirname, 'dummy-hmr'));

  // NOTE replace mdx to null loader for now
  // TODO Use mdx plugin from storybook and then apply creevey-loader
  const mdxRegexps = [
    /\.mdx$/,
    /\.(stories|story).mdx$/, // NOTE Storybook <= 6.1 has a bug with incorrect regexp
    /\.(stories|story)\.mdx$/,
    /(stories|story)\.mdx$/, // NOTE Introduced in 6.2
  ].map((x) => x.toString());
  storybookWebpackConfig.module?.rules
    .filter((rule) => mdxRegexps.some((x) => rule.test?.toString() == x))
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
  storybookWebpackConfig.module?.rules.unshift({
    enforce: 'pre',
    test: new RegExp(`\\.(${extensions.map((x) => x.slice(1))?.join('|')})$`),
    exclude: /node_modules/,
    use: { loader: require.resolve('./loader'), options: { debug, storybookDir: config.storybookDir } },
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

  // NOTE Exclude some plugins
  const excludedPlugins = ['DocgenPlugin', 'ForkTsCheckerWebpackPlugin'];
  storybookWebpackConfig.plugins = storybookWebpackConfig.plugins?.filter(
    (plugin) => !excludedPlugins.includes(plugin.constructor.name),
  );

  const storybookWebpackCompiler = webpack(storybookWebpackConfig);
  if (ui) {
    const watcher = storybookWebpackCompiler.watch({}, (error: Error, stats: webpack.Stats) => {
      if (debug) writeFile(path.join(config.reportDir, 'stats.json'), JSON.stringify(stats.toJson(), null, 2), noop);
      handleWebpackBuild(error, stats);
    });

    subscribeOn('shutdown', () => watcher.close(noop));
  } else {
    storybookWebpackCompiler.run((error: Error, stats: webpack.Stats) => {
      if (debug) writeFile(path.join(config.reportDir, 'stats.json'), JSON.stringify(stats.toJson(), null, 2), noop);
      handleWebpackBuild(error, stats);
    });
  }
}
