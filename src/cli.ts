#!/usr/bin/env node

import fs, { Dirent } from 'fs';
import path from 'path';

type PlatformFS = typeof fs;
type PlatformPath = typeof path;

function registerRequireContext(): void {
  function requireContext(rootPath: string, deep?: boolean, filter?: RegExp): __WebpackModuleApi.RequireContext {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs: PlatformFS = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path: PlatformPath = require('path');

    const ids: string[] = [];
    let contextPath: string;
    // Relative path
    if (rootPath.startsWith('.')) contextPath = path.resolve(__dirname, rootPath);
    // Module path
    else if (!path.isAbsolute(rootPath)) contextPath = require.resolve(rootPath);
    // Absolute path
    else contextPath = rootPath;
    const traverse = (dirPath: string): void => {
      fs.readdirSync(dirPath, { withFileTypes: true }).forEach((dirent: Dirent) => {
        const filename = dirent.name;
        const filePath = path.join(dirPath, filename);

        if (dirent.isDirectory() && deep) return traverse(filePath);
        if (dirent.isFile() && (filter?.test(filePath) ?? true)) return ids.push(filePath);
      });
    };

    traverse(contextPath);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context = (id: string): any => require(id);
    context.id = contextPath;
    context.keys = () => ids;
    context.resolve = (id: string) => id;

    return context;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const { wrap } = module.constructor;

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  module.constructor.wrap = function (script: string) {
    return wrap(
      `require.context = ${requireContext.toString()};
      ${script}`,
    );
  };
}

registerRequireContext();

require('./creevey');
