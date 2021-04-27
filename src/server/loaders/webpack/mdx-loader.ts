/* eslint-disable */
/* @ts-expect-error Copy-paste from storybook/addons/docs/src/frameworks/common/preset.ts */

import createCompiler from '@storybook/addon-docs/mdx-compiler-plugin';

export let mdxLoaders: any[] = [];

// for frameworks that are not working with react, we need to configure
// the jsx to transpile mdx, for now there will be a flag for that
// for more complex solutions we can find alone that we need to add '@babel/plugin-transform-react-jsx'
function createBabelOptions({ babelOptions, mdxBabelOptions, configureJSX }: any) {
  const babelPlugins = mdxBabelOptions?.plugins || babelOptions?.plugins || [];
  const jsxPlugin = [
    require.resolve('@babel/plugin-transform-react-jsx'),
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

const resolveOptions = { paths: [require.resolve('@storybook/addon-docs')] };

const remarkPlugins = ['remark-slug', 'remark-external-links'].map((plugin) =>
  require(require.resolve(plugin, resolveOptions)),
);

export const mdxOptions = (options: any = {}) => ({ compilers: [createCompiler(options)], remarkPlugins });

export function webpack(webpackConfig: any = {}, options: any = {}): any {
  // it will reuse babel options that are already in use in storybook
  // also, these babel options are chained with other presets.
  const { babelOptions, mdxBabelOptions, configureJSX = true } = options;

  mdxLoaders = [
    {
      loader: require.resolve('babel-loader', { paths: [require.resolve('@storybook/core')] }),
      options: createBabelOptions({ babelOptions, mdxBabelOptions, configureJSX }),
    },
    {
      loader: require.resolve('@mdx-js/loader', resolveOptions),
      options: mdxOptions(options),
    },
  ];

  return webpackConfig;
}
