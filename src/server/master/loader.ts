import path from 'path';
import { codeFrameColumns } from '@babel/code-frame';
import { getOptions, OptionObject } from 'loader-utils';
import { validate } from 'schema-utils';
import { JSONSchema7 } from 'schema-utils/declarations/validate';
import { parse } from '@babel/parser';
import traverse, { NodePath, Binding } from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { loader } from 'webpack';
import { isDefined } from '../../types';
import chalk from 'chalk';
import { isStorybookVersionLessThan } from '../utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findRootPath(path: NodePath<any>): NodePath | null {
  return path.find((x) => x.parentPath?.isProgram());
}

function getPropertyPath(path: NodePath<t.ObjectExpression>, name: string): NodePath<t.ObjectProperty> | undefined {
  const propertyPath = path
    .get('properties')
    .find((propPath) => propPath.isObjectProperty() && t.isIdentifier(propPath.node.key, { name }));
  return propertyPath?.isObjectProperty() ? propertyPath : undefined;
}

function getDeclaratorPath<T>(path: NodePath<T>): NodePath<t.VariableDeclarator> | undefined {
  if (path.isIdentifier()) {
    const { path: bindingPath } = path.scope.getBinding(path.node.name) ?? {};
    if (bindingPath?.isVariableDeclarator()) return bindingPath;
  }
}

function getKindObjectNodePath<T>(path: NodePath<T>): NodePath<t.ObjectExpression> | undefined {
  if (path.isObjectExpression()) {
    return getPropertyPath(path, 'title') ? path : undefined;
  }
}

type NestedPropNames = [string, ...(string | NestedPropNames)[]];
type PropNames = (string | NestedPropNames)[];
function removeAllPropsExcept(path: NodePath<t.ObjectExpression>, propNames: PropNames): void {
  path.get('properties').forEach((propPath) => {
    if (propPath.isObjectProperty()) {
      const propName = propNames.find((name) =>
        t.isIdentifier(propPath.node.key, { name: Array.isArray(name) ? name[0] : name }),
      );
      if (!propName) return propPath.remove();
      const restNames = Array.isArray(propName) ? propName.slice(1) : [];
      if (restNames.length == 0) return;
      const propValuePath = propPath?.get('value');
      if (propValuePath?.isObjectExpression()) removeAllPropsExcept(propValuePath, restNames);
    } else if (propPath.isSpreadElement()) {
      const argumentPath = propPath.get('argument');
      if (argumentPath.isObjectExpression()) return removeAllPropsExcept(argumentPath, propNames);
      const declaratorPath = getDeclaratorPath(argumentPath);
      if (declaratorPath) {
        const rightPath = declaratorPath.get('init');
        if (rightPath.isObjectExpression()) removeAllPropsExcept(rightPath, propNames);
        else propPath.remove();
      } else propPath.remove();
    } else propPath.remove();
  });
}

function replaceStoryFnToNoop(declarations: t.VariableDeclarator[]): void {
  declarations.forEach((declarator) => (declarator.init = t.arrowFunctionExpression([], t.blockStatement([]))));
}

function getPropertyAssignmentPaths<T>(
  path: NodePath<T>,
  declarations: t.VariableDeclarator[],
): Map<NodePath<t.AssignmentExpression>, string[]> {
  const assignPaths = new Map<NodePath<t.AssignmentExpression>, string[]>();

  declarations
    .map(({ id }) => id)
    .forEach((id) => {
      if (!t.isIdentifier(id)) return;
      const referencePaths = path.scope.getBinding(id.name)?.referencePaths ?? [];

      referencePaths.forEach((refPath) => {
        const assignmentPath = refPath.findParent((parentPath) => parentPath.isAssignmentExpression());
        if (!assignmentPath?.isAssignmentExpression() || assignPaths.has(assignmentPath)) return;

        const props: string[] = [];
        for (let propPath = refPath.parentPath; propPath != assignmentPath; propPath = propPath.parentPath) {
          if (!propPath.isMemberExpression()) return;
          const propNode = propPath.node.property;
          if (!t.isIdentifier(propNode)) return;
          props.push(propNode.name);
        }

        assignPaths.set(assignmentPath, props);
      });
    });

  return assignPaths;
}

function cleanUpStoryProps(storyPropAssign: NodePath<t.AssignmentExpression>): void {
  const rightPath = storyPropAssign.get('right');
  if (!rightPath?.isObjectExpression()) return;

  removeAllPropsExcept(rightPath, ['name', ['parameters', 'creevey']]);
}

function recursivelyRemoveUnreferencedBindings(path: NodePath<t.Program>): void {
  const getUnreferencedBindings = (): Binding[] => {
    path.scope.crawl();
    return Object.values(path.scope.bindings).filter(
      (binding) =>
        !binding.referenced ||
        binding.referencePaths.every((refPath) => refPath.find((x) => x.node == binding.path.node)),
    );
  };
  let bindings = getUnreferencedBindings();
  do {
    bindings.forEach((binding) => !binding.path.removed && binding.path.remove());
  } while ((bindings = getUnreferencedBindings()).length > 0);
}

function getUnvisitedRefs(
  paths: NodePath[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: { visitedTopPaths: Set<NodePath<any>>; visitedBindings: Set<Binding> },
): NodePath[] {
  const rootPaths = [...new Set(paths.map(findRootPath).filter(isDefined))];
  const bindings = new Set<Binding>();

  rootPaths.forEach((rootPath) => {
    state.visitedTopPaths.add(rootPath);
    rootPath.traverse({
      Identifier(identifierPath) {
        const binding = identifierPath.scope.getBinding(identifierPath.node.name);
        if (binding?.scope == rootPath.scope && !state.visitedBindings.has(binding)) {
          bindings.add(binding);
          state.visitedBindings.add(binding);
        }
      },
    });
  });

  const refs = ([] as NodePath[]).concat(...[...bindings].map((b) => [b.path, ...b.referencePaths]));
  return [...new Set(refs)];
}

function transform(ast: t.File): string {
  traverse(
    ast,
    {
      ExportAllDeclaration(allPath, state) {
        if (fileType == FileType.Story) {
          const request = allPath.get('source').node.value;
          reexportedStories.set(resourcePath, (reexportedStories.get(resourcePath) ?? new Set<string>()).add(request));
          state.visitedTopPaths.add(allPath);
        }
      },
      ExportDefaultDeclaration(defaultPath, state) {
        if (fileType != FileType.Story) return;

        const defaultDeclaration = defaultPath.get('declaration');
        let kindPath = getKindObjectNodePath(defaultDeclaration);
        const declaratorPath = getDeclaratorPath(defaultDeclaration);
        if (declaratorPath) {
          const kindInitPath = declaratorPath.get('init');
          if (!Array.isArray(kindInitPath)) kindPath = getKindObjectNodePath(kindInitPath);
        }
        if (!kindPath) return;

        state.visitedTopPaths.add(defaultPath);

        removeAllPropsExcept(kindPath, ['title', ['parameters', 'creevey'], 'includeStories', 'excludeStories']);

        if (declaratorPath) {
          const kindPropAssigns = getPropertyAssignmentPaths(defaultPath, [declaratorPath.node]);
          for (const [assignPath, props] of kindPropAssigns?.entries() ?? []) {
            const [first, second] = props;
            if (first == 'title' || first == 'includeStories' || first == 'excludeStories') continue;
            else if (first == 'parameters') {
              if (!second) {
                const rightPath = assignPath.get('right');
                if (!rightPath?.isObjectExpression()) continue; // TODO it could be reassign
                removeAllPropsExcept(rightPath, ['creevey']);
              } else if (second != 'creevey') assignPath.remove();
            } else assignPath.remove();
          }
        }
      },
      ExportNamedDeclaration(namedPath, state) {
        if (fileType == FileType.Story) {
          state.visitedTopPaths.add(namedPath);
          const namedDeclaration = namedPath.node.declaration;
          if (!t.isVariableDeclaration(namedDeclaration)) {
            if (t.isFunctionDeclaration(namedDeclaration)) namedDeclaration.body = t.blockStatement([]);
            return;
          }
          replaceStoryFnToNoop(namedDeclaration.declarations);
          const storyFnPropAssigns = getPropertyAssignmentPaths(namedPath, namedDeclaration.declarations);
          for (const [assignPath, props] of storyFnPropAssigns.entries()) {
            const [first, second, third] = props;
            if (first == 'storyName') continue;
            else if (first == 'story') {
              if (!second) cleanUpStoryProps(assignPath);
              else if (second == 'name') continue;
              else if (second == 'parameters') {
                if (!third) {
                  const rightPath = assignPath.get('right');
                  if (!rightPath?.isObjectExpression()) continue;
                  removeAllPropsExcept(rightPath, ['creevey']);
                } else if (third != 'creevey') assignPath.remove();
              } else assignPath.remove();
            } else if (first == 'parameters') {
              if (!second) {
                const rightPath = assignPath.get('right');
                if (!rightPath?.isObjectExpression()) continue;
                removeAllPropsExcept(rightPath, ['creevey']);
              } else if (second != 'creevey') assignPath.remove();
            } else assignPath.remove();
          }
        }
        if (fileType == FileType.Preview) {
          state.visitedTopPaths.add(namedPath);
          const declarationPath = namedPath.get('declaration');
          if (!declarationPath.isVariableDeclaration()) return;
          const declarations = declarationPath.get('declarations');
          if (!Array.isArray(declarations)) return;
          declarations.forEach((declPath) => {
            if (!declPath.isVariableDeclarator()) return;
            if (t.isIdentifier(declPath.node.id, { name: 'decorators' })) return declPath.remove();
            if (t.isIdentifier(declPath.node.id, { name: 'parameters' })) {
              const initPath = declPath.get('init');
              if (Array.isArray(initPath)) return;
              if (initPath.isObjectExpression()) return removeAllPropsExcept(initPath, ['creevey']);
              const resolvedDeclPath = getDeclaratorPath(initPath);
              if (resolvedDeclPath) {
                const rightPath = resolvedDeclPath.get('init');
                if (!rightPath.isObjectExpression()) return;
                removeAllPropsExcept(rightPath, ['creevey']);
              }
            }
          });
        }
      },
      CallExpression(rootCallPath, state) {
        const rootPath = findRootPath(rootCallPath);
        if (fileType == FileType.Preview) {
          if (rootCallPath.get('callee').isIdentifier({ name: 'configure' })) {
            if (rootPath) state.visitedTopPaths.add(rootPath);
            return;
          }
          if (rootCallPath.get('callee').isIdentifier({ name: 'addDecorator' })) {
            rootCallPath.remove();
            return;
          }
          if (rootCallPath.get('callee').isIdentifier({ name: 'addParameters' })) {
            const [argPath] = rootCallPath.get('arguments');
            if (!argPath || !argPath.isObjectExpression()) return;
            if (rootPath) state.visitedTopPaths.add(rootPath);
            removeAllPropsExcept(argPath, ['creevey']);
            return;
          }
        }
        if (fileType == FileType.Story) {
          if (!rootCallPath.get('callee').isIdentifier({ name: 'storiesOf' })) return;
          if (rootPath) state.visitedTopPaths.add(rootPath);
          let callPath = rootCallPath as NodePath;
          do {
            const childCallPath = callPath;
            const { parentPath: memberPath } = childCallPath;
            const propPath = memberPath.get('property');
            callPath = memberPath.parentPath;
            if (!memberPath.isMemberExpression() || !callPath.isCallExpression()) return;
            if (!Array.isArray(propPath) && propPath.isIdentifier({ name: 'add' })) {
              const [, storyPath, parametersPath] = callPath.get('arguments');
              storyPath.replaceWith(t.arrowFunctionExpression([], t.blockStatement([])));
              if (parametersPath?.isObjectExpression()) getPropertyPath(parametersPath, 'decorators')?.remove();
            }
            if (!Array.isArray(propPath) && propPath.isIdentifier({ name: 'addDecorator' })) {
              callPath.replaceWith(childCallPath);
            }
          } while (callPath.parentPath != null);
        }
      },
      FunctionDeclaration(functionPath) {
        const functionName = functionPath.get('id').node?.name;
        if (isMDX && functionName == 'MDXContent') {
          const rootPath = findRootPath(functionPath);
          const refs = rootPath?.scope.getBinding(functionName)?.referencePaths ?? [];
          refs.forEach((refPath) => findRootPath(refPath)?.remove());
          rootPath?.remove();
        }
      },
      Program: {
        enter(path) {
          path.traverse({
            TSDeclareFunction(path) {
              path.remove();
            },
            TSTypeAliasDeclaration(path) {
              path.remove();
            },
            TSInterfaceDeclaration(path) {
              path.remove();
            },
            TSTypeAnnotation(path) {
              path.remove();
            },
            TSAsExpression(path) {
              path.replaceWith(path.get('expression'));
            },
          });
        },
        exit(path, state) {
          if (fileType != FileType.Story && fileType != FileType.Preview) return;

          recursivelyRemoveUnreferencedBindings(path);

          path.traverse({
            ImportDeclaration(path) {
              if (path.node.specifiers.length == 0) path.remove();
            },
          });

          let refs = [...state.visitedTopPaths];
          while (refs.length > 0) {
            refs = getUnvisitedRefs(refs, state);
          }
          path
            .get('body')
            .filter((x) => !state.visitedTopPaths.has(x))
            .forEach((x) => x.remove());
        },
      },
    },
    undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { isStoriesFile: false, visitedTopPaths: new Set<NodePath<any>>(), visitedBindings: new Set<Binding>() },
  );

  return generate(ast, { retainLines: true }).code;
}

function toPosix(filePath: string): string {
  return filePath
    .split(path.win32.sep)
    .join(path.posix.sep)
    .replace(/^[a-z]:/i, '');
}

function getIssuerResource(context: loader.LoaderContext): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return context._module?.issuer?.resource;
}

function getIssuerConstructorName(context: loader.LoaderContext): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return context._module?.issuer?.constructor?.name;
}

function isEntry(context: loader.LoaderContext): boolean {
  return getIssuerConstructorName(context) == 'MultiModule';
}

function isPreview(context: loader.LoaderContext, options: Options | Readonly<OptionObject>): boolean {
  const { dir: resourceDir, name: resourceName } = path.posix.parse(toPosix(context.resourcePath));
  const storybookDir = typeof options.storybookDir == 'string' ? toPosix(options.storybookDir) : '';
  const isConfigFile = resourceDir == storybookDir && (resourceName == 'preview' || resourceName == 'config');
  if (isStorybookVersionLessThan(6)) {
    return isEntry(context) && isConfigFile;
  }
  const issuerResource = getIssuerResource(context);
  return Boolean(issuerResource && entries.has(issuerResource) && isConfigFile);
}

function isStoryFile(context: loader.LoaderContext): boolean {
  const issuerResource = getIssuerResource(context);
  return (
    getIssuerConstructorName(context) == 'ContextModule' ||
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    Boolean(issuerResource && reexportedStories.get(issuerResource)?.has(context._module?.rawRequest as string)) ||
    (issuerResource == previewPath && path.posix.parse(toPosix(previewPath)).name == 'config')
  );
}

// NOTE: non-story files before preview => issuer.resource is entry

export enum FileType {
  Invalid = -1,
  Entry,
  Preview,
  Story,
}

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
const isTest = process.env.NODE_ENV == 'test';
const defaultOptions: Options = {
  debug: isTest,
  storybookDir: process.cwd(),
};

export default function (this: loader.LoaderContext | void, source: string): string {
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
    } else if (issuerResource && stories.has(issuerResource) && options.debug) {
      console.log(
        chalk`[{yellow WARN}:CreeveyWebpack]`,
        'Trying to transform possible non-story file',
        this.resourcePath,
        'Please check the',
        issuerResource,
      );
      // TODO Add link to docs, how creevey works and what user should do in this situation
    }
  }
  if (isTest && !Number.isNaN(Number(process.env.CREEVEY_LOADER_FILE_TYPE))) {
    fileType = Number(process.env.CREEVEY_LOADER_FILE_TYPE);
  }

  try {
    const ast = parse(source, {
      sourceType: 'module',
      plugins: ['classProperties', 'decorators-legacy', 'jsx', 'typescript'],
    });
    console.log(source);
    return transform(ast);
  } catch (error) {
    this && console.log(chalk`[{yellow WARN}{grey :CreeveyWebpack}]`, 'Failed to transform file', this.resourcePath);
    if ('loc' in error) {
      console.log(
        codeFrameColumns(
          source,
          { start: ((error as unknown) as { loc: t.SourceLocation['start'] }).loc },
          { highlightCode: true },
        ),
      );
    } else {
      console.log(error);
    }
    return source;
  }
}
