import { rmdirSync, writeFile } from 'fs';
import path from 'path';
import webpack, { Configuration, RuleSetUse, Stats } from 'webpack';
import nodeExternals from 'webpack-node-externals';
import {
  extensions as fallbackExtensions,
  getCreeveyCache,
  getStorybookFramework,
  getStorybookParentDirectory,
  hasDocsAddon,
  isStorybookVersion,
  isStorybookVersionLessThan,
} from '../../utils';
import { Config, Options, noop } from '../../../types';
import { emitWebpackMessage, subscribeOn } from '../../messages';

let isInitiated = false;
let dumpStats: (stats: Stats) => void = noop;

function handleWebpackBuild(error: Error, stats: Stats): void {
  dumpStats(stats);

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

async function applyMdxLoader(config: Configuration, areAddonsRemoved: boolean, loader: RuleSetUse): Promise<void> {
  const { mdxLoaders } = await import('./mdx-loader');

  mdxLoaders.splice(1, 0, loader);

  const mdxRegexps = isStorybookVersionLessThan(6, 2)
    ? [/\.(stories|story).mdx$/, /\.(stories|story)\.mdx$/]
    : [/(stories|story)\.mdx$/];

  // NOTE replace md/mdx to null loader
  const mdRegexps = [/\.md$/, /\.mdx$/];

  if (areAddonsRemoved) {
    mdRegexps.forEach((test) =>
      config.module?.rules.push({ test, exclude: /(stories|story)\.mdx$/, use: require.resolve('null-loader') }),
    );
    config.module?.rules.push({ test: /(stories|story)\.mdx$/, use: mdxLoaders });
  } else {
    // NOTE Exclude addons' entry points
    config.entry = Array.isArray(config.entry)
      ? config.entry.filter((entry) => !/@storybook(\/|\\)addon/.test(entry))
      : config.entry;

    config.module?.rules
      .filter((rule) => mdRegexps.some((test) => rule.test?.toString() == test.toString()))
      .forEach((rule) => (rule.use = require.resolve('null-loader')));

    config.module?.rules
      .filter((rule) => mdxRegexps.some((test) => rule.test?.toString() == test.toString()))
      .forEach((rule) => (rule.use = mdxLoaders as RuleSetUse));

    // NOTE Exclude source-loader
    config.module = {
      ...config.module,
      rules:
        config.module?.rules.filter(
          (rule) => !(typeof rule.loader == 'string' && /@storybook(\/|\\)source-loader/.test(rule.loader)),
        ) ?? [],
    };
  }
}

async function getWebpackConfigForStorybook_pre6_2(
  framework: string,
  configDir: string,
  outputDir: string,
): Promise<Configuration> {
  const { default: storybookFrameworkOptions } = (await import(`@storybook/${framework}/dist/server/options`)) as {
    default: { framework: string; frameworkPresets: string[] };
  };

  //@ts-expect-error: This module exists in Storybook <= 6.1
  // eslint-disable-next-line node/no-missing-import, @typescript-eslint/no-unsafe-assignment, import/no-unresolved
  const { default: getConfig } = await import('@storybook/core/dist/server/config');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return getConfig({
    // NOTE: 6.1 storybook don't support quite any more. But we still have older versions
    quiet: true,
    configType: 'PRODUCTION',
    outputDir,
    cache: {},
    // eslint-disable-next-line node/no-missing-require
    corePresets: [require.resolve('@storybook/core/dist/server/preview/preview-preset')],
    overridePresets: [
      ...(hasDocsAddon ? [require.resolve('./mdx-loader')] : []),
      // eslint-disable-next-line node/no-missing-require
      require.resolve('@storybook/core/dist/server/preview/custom-webpack-preset'),
    ],
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
  const options = {
    quiet: true,
    configType: 'PRODUCTION',
    outputDir,
    configDir,
    ...storybookFrameworkOptions,
  };

  //@ts-expect-error missing import
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { getPreviewBuilder } = await import('@storybook/core-server/dist/cjs/utils/get-preview-builder');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
    ] as string[],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    overridePresets: [...(hasDocsAddon ? [require.resolve('./mdx-loader')] : []), ...builder.overridePresets],
    ...options,
  } as Parameters<typeof loadAllPresets>[0]);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  return builder.getConfig({ ...options, presets });
}

async function removeAddons(configDir: string): Promise<boolean> {
  const storybookUtilsPath = isStorybookVersionLessThan(6, 2)
    ? '@storybook/core/dist/server/utils'
    : '@storybook/core-common/dist/cjs/utils';
  const serverRequireModule = isStorybookVersionLessThan(6, 2) ? 'server-require' : 'interpret-require';
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { getInterpretedFile } = await import(`${storybookUtilsPath}/interpret-files`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { serverRequire } = await import(`${storybookUtilsPath}/${serverRequireModule}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mainConfigFile = isStorybookVersion(6)
      ? path.join(configDir, 'main')
      : // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        getInterpretedFile(path.join(configDir, 'main'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const config = serverRequire(mainConfigFile) as {
      stories: string[];
      addons?: (string | { name: string })[];
    };
    if (config.addons && config.stories) {
      config.addons = [];
      return true;
    }
  } catch (_) {
    /* noop */
  }
  return false;
}

export default async function compile(config: Config, { debug, ui }: Options): Promise<void> {
  const storybookFramework = getStorybookFramework();

  const outputDir = path.join(getCreeveyCache(), 'storybook');

  try {
    rmdirSync(outputDir, { recursive: true });
  } catch (_) {
    /* noop */
  }

  const creeveyLoader = {
    loader: require.resolve('./creevey-loader'),
    options: { debug, storybookDir: config.storybookDir },
  };

  // NOTE Remove addons by monkey patching, only for new config file (main.js)
  const areAddonsRemoved = await removeAddons(config.storybookDir);

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

  // NOTE Add hack to allow stories HMR work in nodejs
  Array.isArray(storybookWebpackConfig.entry) && storybookWebpackConfig.entry.unshift(require.resolve('./dummy-hmr'));

  // NOTE apply creevey loader to output from mdx loader
  if (hasDocsAddon) await applyMdxLoader(storybookWebpackConfig, areAddonsRemoved, creeveyLoader);

  // NOTE Add creevey-loader to cut off all unnecessary code except stories meta and tests
  storybookWebpackConfig.module?.rules.unshift({
    enforce: 'pre',
    test: new RegExp(`\\.(${extensions.map((x) => x.slice(1))?.join('|')})$`),
    exclude: /node_modules/,
    use: creeveyLoader,
  });

  const aliases = storybookWebpackConfig.resolve?.alias ?? {};
  const excluded = [
    '@storybook/addons',
    '@storybook/api',
    '@storybook/channel-postmessage',
    '@storybook/channels',
    '@storybook/client-api',
    '@storybook/client-logger',
    '@storybook/components',
    '@storybook/core-events',
    '@storybook/router',
    '@storybook/semver',
    '@storybook/theming',
  ];

  // NOTE Exclude from bundle all modules from node_modules
  storybookWebpackConfig.externals = [
    ...Object.entries(aliases)
      .filter(([alias]) => excluded.includes(alias))
      .map(([, aliasPath]) => ({ [aliasPath]: `commonjs ${aliasPath}` })),

    // NOTE Replace `@storybook/${framework}` to ../../storybook.ts
    { [`@storybook/${storybookFramework}`]: `commonjs ${require.resolve('../../storybook')}` },
    nodeExternals({
      includeAbsolutePaths: true,
      allowlist: /(webpack|dummy-hmr|generated-stories-entry|generated-config-entry|generated-other-entry)/,
    }),
    // TODO Don't work well with monorepos
    nodeExternals({
      modulesDir: getStorybookParentDirectory(),
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

  if (debug) {
    dumpStats = (stats: Stats) =>
      writeFile(path.join(config.reportDir, 'stats.json'), JSON.stringify(stats.toJson(), null, 2), noop);
  }

  if (ui) {
    const watcher = storybookWebpackCompiler.watch({}, handleWebpackBuild);

    subscribeOn('shutdown', () => watcher.close(noop));
  } else {
    storybookWebpackCompiler.run(handleWebpackBuild);
  }
}
