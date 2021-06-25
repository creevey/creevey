/* eslint-disable */
/* Copy-paste from storybook/addons/docs/src/frameworks/common/preset.ts */

import {
  isStorybookVersionLessThan,
  resolveFromStorybook,
  resolveFromStorybookAddonDocs,
  resolveFromStorybookBuilderWebpack4,
  resolveFromStorybookCore,
} from '../../storybook/helpers';

export let mdxLoaders: any[] = [];

// for frameworks that are not working with react, we need to configure
// the jsx to transpile mdx, for now there will be a flag for that
// for more complex solutions we can find alone that we need to add '@babel/plugin-transform-react-jsx'
function createBabelOptions({ babelOptions, mdxBabelOptions, configureJSX }: any) {
  const babelPlugins = mdxBabelOptions?.plugins || babelOptions?.plugins || [];
  const jsxPlugin = [
    resolveFromStorybookAddonDocs('@babel/plugin-transform-react-jsx'),
    { pragma: 'React.createElement', pragmaFrag: 'React.Fragment' },
  ];
  const plugins = configureJSX ? [...babelPlugins, jsxPlugin] : babelPlugins;
  return {
    // don't use the root babelrc by default (users can override this in mdxBabelOptions)
    babelrc: false,
    configFile: false,
    ...babelOptions,
    ...mdxBabelOptions,
    plugins,
  };
}

const remarkPlugins = ['remark-slug', 'remark-external-links'].map((plugin) =>
  require(resolveFromStorybookAddonDocs(plugin)),
);

const createCompiler = require(resolveFromStorybook('@storybook/addon-docs/mdx-compiler-plugin'));

export const mdxOptions = (options: any = {}) => ({ compilers: [createCompiler(options)], remarkPlugins });

export function webpack(webpackConfig: any = {}, options: any = {}): any {
  // it will reuse babel options that are already in use in storybook
  // also, these babel options are chained with other presets.
  const { babelOptions, mdxBabelOptions, configureJSX = true } = options;

  mdxLoaders = [
    {
      loader: isStorybookVersionLessThan(6, 2)
        ? resolveFromStorybookCore('babel-loader')
        : resolveFromStorybookBuilderWebpack4('babel-loader'),
      options: createBabelOptions({ babelOptions, mdxBabelOptions, configureJSX }),
    },
    {
      loader: resolveFromStorybookAddonDocs('@mdx-js/loader'),
      options: mdxOptions(options),
    },
  ];

  return webpackConfig;
}
