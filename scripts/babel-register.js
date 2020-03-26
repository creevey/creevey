/* eslint-disable-next-line @typescript-eslint/no-var-requires */
require('@babel/register')({
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  ignore: [/node_modules\/(?!@(skbkontur\/react-(ui|icons)|babel\/runtime\/helpers\/esm))/],
});
