// TODO: mdx@1 doesn't have types :(
declare module '@mdx-js/mdx' {
  export default {
    sync(code: string, options: unknown): string;,
  };
}
