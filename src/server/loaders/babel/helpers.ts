import { NodePath, Binding, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { isDefined } from '../../../types.js';

function isExports(path: NodePath<t.Identifier>): boolean {
  const { parentPath } = path;
  return (
    path.node.name == 'exports' &&
    path.scope.hasGlobal('exports') &&
    !path.scope.hasBinding('exports') &&
    parentPath.isMemberExpression() &&
    parentPath.get('object').isIdentifier({ name: 'exports' })
  );
}

function isModuleExports(path: NodePath<t.Identifier>): boolean {
  const { parentPath } = path;
  return (
    path.node.name == 'module' &&
    path.scope.hasGlobal('module') &&
    !path.scope.hasBinding('module') &&
    parentPath.isMemberExpression() &&
    parentPath.get('object').isIdentifier({ name: 'module' }) &&
    parentPath.get('property').isIdentifier({ name: 'exports' })
  );
}

function isObjectAssign(path?: NodePath): path is NodePath<t.CallExpression> {
  if (!path?.isCallExpression()) return false;
  const calleePath = path.get('callee');
  return (
    calleePath.isMemberExpression() &&
    calleePath.get('object').isIdentifier({ name: 'Object' }) &&
    calleePath.get('property').isIdentifier({ name: 'assign' })
  );
}

function isTemplateBind(path?: NodePath): path is NodePath<t.CallExpression> {
  if (!path?.isCallExpression()) return false;
  const calleePath = path.get('callee');
  return (
    calleePath.isMemberExpression() &&
    calleePath.get('object').isIdentifier() &&
    calleePath.get('property').isIdentifier({ name: 'bind' })
  );
}

function findRootPath<T>(path: NodePath<T>): NodePath | null {
  return path.find((x) => Boolean(x.parentPath?.isProgram()));
}

function getPropertyPath(path: NodePath<t.ObjectExpression>, name: string): NodePath<t.ObjectProperty> | undefined {
  const propertyPath = path
    .get('properties')
    .find((propPath) => propPath.isObjectProperty() && t.isIdentifier(propPath.node.key, { name }));
  return propertyPath?.isObjectProperty() ? propertyPath : undefined;
}

// TODO Support import and process them
function getDeclaratorPath<T>(
  path?: NodePath<T>,
): NodePath<t.VariableDeclarator> | NodePath<t.FunctionDeclaration> | NodePath<t.ImportSpecifier> | undefined {
  if (path?.isIdentifier()) {
    const { path: bindingPath } = path.scope.getBinding(path.node.name) ?? {};
    if (bindingPath?.isVariableDeclarator() || bindingPath?.isFunctionDeclaration() || bindingPath?.isImportSpecifier())
      return bindingPath;
  }
}

function getKindObjectNodePath<T>(path: NodePath<T>): NodePath<t.ObjectExpression> | undefined {
  if (path.isObjectExpression()) {
    return getPropertyPath(path, 'title') ? path : undefined;
  }
}

function getIdentifiers(
  path: (NodePath<t.FunctionDeclaration> | NodePath<t.VariableDeclarator>)[],
): NodePath<t.Identifier>[] {
  return path
    .map((x) => (x.isFunctionDeclaration() ? x.get('id') : x.get('id')))
    .map((idPath) => (idPath.isIdentifier() ? idPath : null))
    .filter(isDefined);
}

type NestedPropNames = [string | ((name: string) => boolean), ...(string | NestedPropNames)[]];
type PropNames = (string | NestedPropNames)[];
function removeAllPropsExcept(path: NodePath<t.ObjectExpression>, propNames: PropNames): void {
  const getPropName = (
    propPath: NodePath<t.ObjectProperty> | NodePath<t.ObjectMethod>,
  ): string | NestedPropNames | undefined =>
    propNames.find((names) => {
      const keyPath = propPath.isObjectProperty() ? propPath.get('key') : propPath.get('key');
      if (!keyPath.isIdentifier()) return;
      const name = Array.isArray(names) ? names[0] : names;
      return typeof name == 'string' ? keyPath.isIdentifier({ name }) : name(keyPath.node.name);
    });
  path.get('properties').forEach((propPath) => {
    if (propPath.isObjectProperty() || propPath.isObjectMethod()) {
      const propName = getPropName(propPath);
      if (!propName) return propPath.remove();
      const restNames = Array.isArray(propName) ? (propName.slice(1) as PropNames) : [];
      if (propPath.isObjectProperty() && restNames.length != 0)
        removeAllExpressionPropsExcept(propPath?.get('value'), restNames);
      if (propPath.isObjectMethod() && restNames[0] == 'storyName') replaceStoryFnToNoop(propPath);
    } else if (propPath.isSpreadElement()) {
      removeAllExpressionPropsExcept(propPath.get('argument'), propNames);
    } else propPath.remove();
  });
}

function removeAllPropAssignsExcept(
  propAssigns: IterableIterator<[NodePath<t.AssignmentExpression>, string[]]>,
  propNames: PropNames,
): void {
  for (const [assignPath, props] of propAssigns ?? []) {
    const restNames = props.reduce((subPropNames, prop) => {
      const propName = subPropNames.find((names) => {
        const name = Array.isArray(names) ? names[0] : names;
        return typeof name == 'string' ? name == prop : name(prop);
      });
      if (Array.isArray(propName)) return propName.slice(1) as PropNames;
      if (!propName) assignPath.remove();
      return [];
    }, propNames);
    if (restNames.length != 0) removeAllExpressionPropsExcept(assignPath.get('right'), restNames);
  }
}

function replaceStoryFnToNoop(path?: NodePath): void {
  if (path?.isArrowFunctionExpression()) path.get('body').replaceWith(t.blockStatement([]));
  else if (path?.isFunctionDeclaration()) path.get('body').replaceWith(t.blockStatement([]));
  else if (path?.isFunctionExpression()) path.get('body').replaceWith(t.blockStatement([]));
  else if (path?.isObjectMethod()) path.get('body').replaceWith(t.blockStatement([]));
}

function getAssignmentPathWithProps(refPath: NodePath): [NodePath<t.AssignmentExpression>, string[]] | undefined {
  const assignmentPath = refPath.findParent((parentPath) => parentPath.isAssignmentExpression());
  if (!assignmentPath?.isAssignmentExpression()) return;

  const props: string[] = [];
  for (let propPath = refPath.parentPath; propPath != assignmentPath; propPath = propPath.parentPath) {
    if (!propPath?.isMemberExpression()) return;
    const propNode = propPath.node.property;
    if (!t.isIdentifier(propNode)) return;
    props.push(propNode.name);
  }
  if (props.length != 0) return [assignmentPath, props];
}

function getPropertyAssignmentPaths(
  idPaths: NodePath<t.Identifier>[],
): Map<NodePath<t.AssignmentExpression>, string[]> {
  const assignPaths = new Map<NodePath<t.AssignmentExpression>, string[]>();

  idPaths.forEach((idPath) => {
    const referencePaths = idPath.scope.getBinding(idPath.node.name)?.referencePaths ?? [];

    referencePaths.forEach((refPath) => {
      const [assignmentPath, props] = getAssignmentPathWithProps(refPath) ?? [];

      if (assignmentPath && props) assignPaths.set(assignmentPath, props);
    });
  });

  return assignPaths;
}

function removeAllExpressionPropsExcept<T>(expressionPath: NodePath<T> | undefined, propNames: PropNames): void {
  const resolvedDeclPath = getDeclaratorPath(expressionPath);
  if (expressionPath?.isObjectExpression()) removeAllPropsExcept(expressionPath, propNames);
  else if (expressionPath?.isCallExpression()) {
    if (isObjectAssign(expressionPath as unknown as NodePath))
      (expressionPath as NodePath<t.CallExpression>)
        .get('arguments')
        .forEach((argumentPath) => removeAllExpressionPropsExcept(argumentPath, storyProps));
    else if (isTemplateBind(expressionPath as unknown as NodePath)) {
      const calleePath = (expressionPath as NodePath<t.CallExpression>).get('callee');
      if (calleePath.isMemberExpression()) removeAllExpressionPropsExcept(calleePath.get('object'), propNames);
    } else if (propNames[0] == 'storyName') {
      expressionPath?.replaceWith(t.arrowFunctionExpression([], t.blockStatement([])));
    }
  } else if (
    (expressionPath?.isFunctionExpression() || expressionPath?.isArrowFunctionExpression()) &&
    propNames[0] == 'storyName'
  )
    replaceStoryFnToNoop(expressionPath);
  else if ((!resolvedDeclPath || resolvedDeclPath.isImportSpecifier()) && propNames[0] == 'storyName')
    expressionPath?.replaceWith(t.arrowFunctionExpression([], t.blockStatement([])));
  if (resolvedDeclPath) {
    if (!resolvedDeclPath.isImportSpecifier())
      removeAllPropAssignsExcept(getPropertyAssignmentPaths(getIdentifiers([resolvedDeclPath])).entries(), propNames);
    if (resolvedDeclPath.isVariableDeclarator())
      removeAllExpressionPropsExcept(resolvedDeclPath.get('init'), propNames);
    if (resolvedDeclPath.isFunctionDeclaration() && propNames[0] == 'storyName') replaceStoryFnToNoop(resolvedDeclPath);
  }
}

function cleanUpStoriesOfCallChain(storiesOfPath: NodePath): void {
  let callPath = storiesOfPath;
  do {
    const childCallPath = callPath;
    const { parentPath: memberPath } = childCallPath;
    if (!memberPath || !memberPath.isMemberExpression()) return;
    callPath = memberPath.parentPath;
    const propPath = memberPath.get('property');
    if (!callPath.isCallExpression()) return;
    if (propPath.isIdentifier({ name: 'add' })) {
      const [, storyPath, parametersPath] = callPath.get('arguments');
      storyPath.replaceWith(t.arrowFunctionExpression([], t.blockStatement([])));
      removeAllExpressionPropsExcept(parametersPath, ['creevey']);
    } else if (propPath.isIdentifier({ name: 'addDecorator' })) {
      callPath.replaceWith(childCallPath);
    } else if (propPath.isIdentifier({ name: 'addParameters' })) {
      const [parametersPath] = callPath.get('arguments');
      removeAllExpressionPropsExcept(parametersPath, ['creevey']);
    }
  } while (callPath.parentPath != null);
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

export enum FileType {
  Invalid = -1,
  Entry,
  Preview,
  Story,
}

export interface VisitorState {
  resourcePath: string;
  fileType: FileType;
  isMDX: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visitedTopPaths: Set<NodePath<any>>;
  visitedBindings: Set<Binding>;
  reexportedStories: Map<string, Set<string>>;
}

export const commonVisitor: TraverseOptions<VisitorState> = {
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
    exit(path) {
      if (this.fileType != FileType.Story && this.fileType != FileType.Preview) return;

      recursivelyRemoveUnreferencedBindings(path);

      path.traverse({
        ImportDeclaration(path) {
          if (path.node.specifiers.length == 0) path.remove();
        },
      });

      let refs = [...this.visitedTopPaths] as NodePath[];
      while (refs.length > 0) {
        refs = getUnvisitedRefs(refs, this);
      }
      path
        .get('body')
        .filter((x) => !this.visitedTopPaths.has(x))
        .forEach((x) => x.remove());
    },
  },
};

export const previewVisitor: TraverseOptions<VisitorState> = {
  ExportNamedDeclaration(namedPath) {
    this.visitedTopPaths.add(namedPath);
    const declarationPath = namedPath.get('declaration');
    if (!declarationPath.isVariableDeclaration()) return;
    declarationPath.get('declarations').forEach((declPath: NodePath<t.VariableDeclarator>) => {
      if (!declPath.isVariableDeclarator()) return;
      if (t.isIdentifier(declPath.node.id, { name: 'decorators' })) return declPath.remove();
      if (t.isIdentifier(declPath.node.id, { name: 'parameters' })) {
        removeAllExpressionPropsExcept(declPath.get('init'), ['creevey']);
      }
    });
  },
  CallExpression(rootCallPath) {
    const rootPath = findRootPath(rootCallPath);
    const calleePath = rootCallPath.get('callee');
    if (calleePath.isIdentifier({ name: 'configure' }) && rootPath) this.visitedTopPaths.add(rootPath);
    else if (calleePath.isIdentifier({ name: 'addDecorator' })) rootCallPath.remove();
    else if (calleePath.isIdentifier({ name: 'addParameters' })) {
      const [argPath] = rootCallPath.get('arguments');
      if (!argPath || !argPath.isObjectExpression()) return;
      if (rootPath) this.visitedTopPaths.add(rootPath);
      removeAllPropsExcept(argPath, ['creevey']);
    }
  },
};

export const mdxVisitor: TraverseOptions<VisitorState> = {
  FunctionDeclaration(functionPath) {
    const functionName = functionPath.get('id').node?.name;
    if (functionName != 'MDXContent') return;
    const rootPath = findRootPath(functionPath);
    const refs = rootPath?.scope.getBinding(functionName)?.referencePaths ?? [];
    refs.forEach((refPath) => findRootPath(refPath)?.remove());
    rootPath?.remove();
  },
};

const kindProps: PropNames = ['title', 'id', ['parameters', 'creevey'], 'includeStories', 'excludeStories'];
const storyProps: PropNames = [
  'storyName',
  ['story', 'name', ['parameters', 'creevey', 'docsOnly']],
  ['parameters', 'creevey', 'docsOnly'],
];
const exportsProps: PropNames = [
  ['default', ...kindProps],
  [(name) => name != 'default', ...storyProps],
];

export const storyVisitor: TraverseOptions<VisitorState> = {
  ExportDefaultDeclaration(defaultPath) {
    const defaultDeclaration = defaultPath.get('declaration');
    const declaratorPath = getDeclaratorPath(defaultDeclaration);
    const kindPath = declaratorPath?.isVariableDeclarator()
      ? getKindObjectNodePath(declaratorPath.get('init'))
      : getKindObjectNodePath(defaultDeclaration);
    if (!kindPath) return;

    this.visitedTopPaths.add(defaultPath);

    removeAllPropsExcept(kindPath, kindProps);

    if (declaratorPath && !declaratorPath.isImportSpecifier())
      removeAllPropAssignsExcept(getPropertyAssignmentPaths(getIdentifiers([declaratorPath])).entries(), kindProps);
  },
  ExportAllDeclaration(allPath) {
    const request = allPath.get('source').node.value;
    this.reexportedStories.set(
      this.resourcePath,
      (this.reexportedStories.get(this.resourcePath) ?? new Set<string>()).add(request),
    );
    this.visitedTopPaths.add(allPath);
  },
  ExportNamedDeclaration(namedPath) {
    this.visitedTopPaths.add(namedPath);
    const declarationPath = namedPath.get('declaration');
    let storyFnPropAssigns = new Map<NodePath<t.AssignmentExpression>, string[]>();
    if (declarationPath.isVariableDeclaration()) {
      const declarations = declarationPath.get('declarations');
      declarations
        .map((x) => x.get('init'))
        .forEach((initPath) => removeAllExpressionPropsExcept(initPath, storyProps));
      storyFnPropAssigns = getPropertyAssignmentPaths(getIdentifiers(declarations));
    } else if (declarationPath.isFunctionDeclaration()) {
      replaceStoryFnToNoop(declarationPath);
      storyFnPropAssigns = getPropertyAssignmentPaths(getIdentifiers([declarationPath]));
    }
    removeAllPropAssignsExcept(storyFnPropAssigns.entries(), storyProps);
  },
  CallExpression(rootCallPath) {
    const rootPath = findRootPath(rootCallPath);
    if (!rootCallPath.get('callee').isIdentifier({ name: 'storiesOf' })) return;
    if (rootPath) this.visitedTopPaths.add(rootPath);
    if (rootPath?.isVariableDeclaration()) {
      const storiesIdPath = rootPath
        .get('declarations')
        .find((decl) => decl.get('init') == rootCallPath)
        ?.get('id');
      if (storiesIdPath?.isIdentifier()) {
        (storiesIdPath.scope.getBinding(storiesIdPath.node.name)?.referencePaths ?? []).forEach(
          cleanUpStoriesOfCallChain,
        );
      }
    }
    cleanUpStoriesOfCallChain(rootCallPath);
  },
  Identifier(identifierPath) {
    if (isExports(identifierPath)) {
      const rootPath = findRootPath(identifierPath);
      if (rootPath) this.visitedTopPaths.add(rootPath);
      const [assignmentPath, props] = getAssignmentPathWithProps(identifierPath) ?? [];

      if (assignmentPath && props) {
        if (props.length == 1 && props[0] != 'default') {
          const declaratorPath = getDeclaratorPath(assignmentPath.get('right'));
          if (declaratorPath && !declaratorPath.isImportSpecifier()) {
            removeAllPropAssignsExcept(
              getPropertyAssignmentPaths(getIdentifiers([declaratorPath])).entries(),
              storyProps,
            );
          } else {
            const rightPath = assignmentPath.get('right');
            if (isObjectAssign(rightPath)) {
              rightPath
                .get('arguments')
                .forEach((argumentPath) => removeAllExpressionPropsExcept(argumentPath, storyProps));
            } else rightPath.replaceWith(t.arrowFunctionExpression([], t.blockStatement([])));
          }
        } else removeAllPropAssignsExcept(new Map([[assignmentPath, props]]).entries(), exportsProps);
      }
    }
    if (isModuleExports(identifierPath)) {
      const rootPath = findRootPath(identifierPath);
      if (rootPath) this.visitedTopPaths.add(rootPath);
      const [assignmentPath, props] = getAssignmentPathWithProps(identifierPath) ?? [];

      if (assignmentPath && props) {
        if (props.length == 1 && props[0] == 'exports') {
          removeAllExpressionPropsExcept(assignmentPath.get('right'), exportsProps);
        } else if (props.length == 2 && props[0] == 'exports' && props[1] != 'default') {
          const declaratorPath = getDeclaratorPath(assignmentPath.get('right'));
          if (declaratorPath && !declaratorPath.isImportSpecifier()) {
            removeAllPropAssignsExcept(
              getPropertyAssignmentPaths(getIdentifiers([declaratorPath])).entries(),
              storyProps,
            );
          } else {
            const rightPath = assignmentPath.get('right');
            if (isObjectAssign(rightPath)) {
              rightPath
                .get('arguments')
                .forEach((argumentPath) => removeAllExpressionPropsExcept(argumentPath, storyProps));
            } else rightPath.replaceWith(t.arrowFunctionExpression([], t.blockStatement([])));
          }
        } else removeAllPropAssignsExcept(new Map([[assignmentPath, props]]).entries(), [['exports', ...exportsProps]]);
      }
    }
  },
};
