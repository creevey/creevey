import path from 'path';
import { codeFrameColumns } from '@babel/code-frame';
import { getOptions, OptionObject } from 'loader-utils';
import { validate } from 'schema-utils';
import { parse } from '@babel/parser';
import { default as traverse, NodePath, Binding } from '@babel/traverse';
import { default as generate } from '@babel/generator';
import * as t from '@babel/types';
import { isStorybookVersionLessThan } from '../../storybook/helpers.js';
import { commonVisitor, mdxVisitor, previewVisitor, storyVisitor, FileType } from '../babel/helpers.js';
import { logger } from '../../logger.js';
import { JSONSchema7 } from 'schema-utils/declarations/validate.js';

type LoaderContext = Parameters<typeof getOptions>[0];

function transform(ast: t.File): string {
  traverse(
    ast,
    {
      ...commonVisitor,
      ...(fileType == FileType.Preview ? previewVisitor : undefined),
      ...(fileType == FileType.Story ? storyVisitor : undefined),
      ...(isMDX ? mdxVisitor : undefined),
    },
    undefined,
    {
      resourcePath,
      fileType,
      isMDX,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      visitedTopPaths: new Set<NodePath<any>>(),
      visitedBindings: new Set<Binding>(),
      reexportedStories,
    },
  );

  return generate(ast, { retainLines: true }).code;
}

function toPosix(filePath: string): string {
  return filePath
    .split(path.win32.sep)
    .join(path.posix.sep)
    .replace(/^[a-z]:/i, '');
}

function getIssuerResource(context: LoaderContext): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return context._module?.issuer?.resource;
}

function getIssuerConstructorName(context: LoaderContext): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return context._module?.issuer?.constructor?.name;
}

function isEntry(context: LoaderContext): boolean {
  return getIssuerConstructorName(context) == 'MultiModule';
}

function isPreview(context: LoaderContext, options: Options | Readonly<OptionObject>): boolean {
  const { dir: resourceDir, name: resourceName } = path.posix.parse(toPosix(context.resourcePath));
  const storybookDir = typeof options.storybookDir == 'string' ? toPosix(options.storybookDir) : '';
  const isConfigFile = resourceDir == storybookDir && (resourceName == 'preview' || resourceName == 'config');
  if (isStorybookVersionLessThan(6)) {
    return isEntry(context) && isConfigFile;
  }
  const issuerResource = getIssuerResource(context);
  return Boolean(issuerResource && entries.has(issuerResource) && isConfigFile);
}

function isStoryFile(context: LoaderContext): boolean {
  const issuerResource = getIssuerResource(context);
  return (
    getIssuerConstructorName(context) == 'ContextModule' ||
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    Boolean(issuerResource && reexportedStories.get(issuerResource)?.has(context._module?.rawRequest as string)) ||
    (issuerResource == previewPath && path.posix.parse(toPosix(previewPath)).name == 'config')
  );
}

// NOTE: non-story files before preview => issuer.resource is entry

interface Options {
  debug: boolean;
  storybookDir: string;
}

const schema: JSONSchema7 = {
  type: 'object',
  properties: {
    debug: { type: 'boolean' },
    storybookDir: { type: 'string' },
  },
};

let fileType = FileType.Invalid;
let isMDX = false;
let previewPath = '';
let resourcePath = '';
const entries = new Set<string>();
const stories = new Set<string>();
const reexportedStories = new Map<string, Set<string>>();
const isTest = (): boolean => process.env.__CREEVEY_ENV__ == 'test';
const defaultOptions: Options = {
  get debug() {
    return isTest();
  },
  storybookDir: process.cwd(),
};

export default function loader(this: LoaderContext | void, source: string): string {
  const options = this ? getOptions(this) || defaultOptions : defaultOptions;
  validate(schema, options, { name: 'Creevey Stories Loader' });

  fileType = FileType.Invalid;

  if (this) {
    const issuerResource = getIssuerResource(this);
    resourcePath = this.resourcePath;
    if (isStoryFile(this)) {
      fileType = FileType.Story;
      isMDX = path.parse(resourcePath).ext == '.mdx';
      stories.add(this.resourcePath);
    } else if (isPreview(this, options)) {
      fileType = FileType.Preview;
      previewPath = this.resourcePath;
    } else if (isEntry(this)) {
      fileType = FileType.Entry;
      entries.add(this.resourcePath);
      return source;
    } else if (issuerResource && stories.has(issuerResource) && options.debug) {
      logger.warn('Trying to transform possible non-story file', this.resourcePath, 'Please check the', issuerResource);
      // TODO Add link to docs, how creevey works and what user should do in this situation
    }
  }
  if (isTest() && !Number.isNaN(Number(process.env.CREEVEY_LOADER_FILE_TYPE))) {
    fileType = Number(process.env.CREEVEY_LOADER_FILE_TYPE);
  }

  try {
    const ast = parse(source, {
      sourceType: 'module',
      plugins: ['classProperties', 'decorators-legacy', 'jsx', 'typescript'],
    });
    return transform(ast);
  } catch (error) {
    this && logger.warn('Failed to transform file', this.resourcePath);
    if (typeof error == 'object' && error && 'loc' in error) {
      logger.warn(
        codeFrameColumns(
          source,
          { start: (error as unknown as { loc: t.SourceLocation['start'] }).loc },
          { highlightCode: true },
        ),
      );
    } else {
      logger.warn(error);
    }
    return source;
  }
}
