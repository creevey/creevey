// TODO: mdx@1 doesn't have types :(
declare module '@mdx-js/mdx' {
  const root: {
    sync(code: string, options: unknown): string;
  };
  export default root;
}
