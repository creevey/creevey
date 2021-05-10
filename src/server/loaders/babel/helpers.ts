import { NodePath, Binding, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { isDefined } from '../../../types';

function findRootPath<T>(path: NodePath<T>): NodePath | null {
  return path.find((x) => x.parentPath?.isProgram());
}

function getPropertyPath(path: NodePath<t.ObjectExpression>, name: string): NodePath<t.ObjectProperty> | undefined {
  const propertyPath = path
    .get('properties')
    .find((propPath) => propPath.isObjectProperty() && t.isIdentifier(propPath.node.key, { name }));
  return propertyPath?.isObjectProperty() ? propertyPath : undefined;
}

function getDeclaratorPath<T>(path?: NodePath<T>): NodePath<t.VariableDeclarator> | undefined {
  if (path?.isIdentifier()) {
    const { path: bindingPath } = path.scope.getBinding(path.node.name) ?? {};
    if (bindingPath?.isVariableDeclarator()) return bindingPath;
  }
}

function getKindObjectNodePath<T>(path: NodePath<T>): NodePath<t.ObjectExpression> | undefined {
  if (path.isObjectExpression()) {
    return getPropertyPath(path, 'title') ? path : undefined;
  }
}

function getIdentifiers(
  path: NodePath<t.VariableDeclarator>[] | NodePath<t.FunctionDeclaration>,
): NodePath<t.Identifier>[] {
  if (Array.isArray(path)) {
    return path
      .map((x) => x.get('id'))
      .map((idPath) => (idPath.isIdentifier() ? idPath : null))
      .filter(isDefined);
  }
  if (path.isFunctionDeclaration()) {
    const idPath = path.get('id');
    return idPath.isIdentifier() ? [idPath] : [];
  }
  return [];
}

type NestedPropNames = [string, ...(string | NestedPropNames)[]];
type PropNames = (string | NestedPropNames)[];
function removeAllPropsExcept(path: NodePath<t.ObjectExpression>, propNames: PropNames): void {
  path.get('properties').forEach((propPath) => {
    if (propPath.isObjectProperty()) {
      const propName: string | NestedPropNames | undefined = propNames.find((name) =>
        t.isIdentifier(propPath.node.key, { name: Array.isArray(name) ? name[0] : name }),
      );
      if (!propName) return propPath.remove();
      const restNames = Array.isArray(propName) ? propName.slice(1) : [];
      if (restNames.length == 0) return;
      removeAllExpressionPropsExcept(propPath?.get('value'), restNames);
    } else if (propPath.isSpreadElement()) {
      const argumentPath = propPath.get('argument');
      removeAllExpressionPropsExcept(argumentPath, propNames);
      removeAllExpressionPropsExcept(getDeclaratorPath(argumentPath)?.get('init'), propNames);
    } else propPath.remove();
  });
}

function removeAllPropAssignsExcept(
  propAssigns: Map<NodePath<t.AssignmentExpression>, string[]>,
  propNames: PropNames,
): void {
  for (const [assignPath, props] of propAssigns.entries() ?? []) {
    const restNames = props.reduce((names, prop) => {
      const propName = names.find((name) => (Array.isArray(name) ? name[0] : name) == prop);
      if (Array.isArray(propName)) return propName.slice(1);
      if (!propName) assignPath.remove();
      return [];
    }, propNames);
    if (restNames.length == 0) continue;
    removeAllExpressionPropsExcept(assignPath.get('right'), restNames);
  }
}

function replaceStoryFnToNoop(declarations: NodePath<t.VariableDeclarator>[]): void {
  declarations.forEach((declarator) =>
    declarator.get('init').replaceWith(t.arrowFunctionExpression([], t.blockStatement([]))),
  );
}

function getPropertyAssignmentPaths(
  idPaths: NodePath<t.Identifier>[],
): Map<NodePath<t.AssignmentExpression>, string[]> {
  const assignPaths = new Map<NodePath<t.AssignmentExpression>, string[]>();

  idPaths.forEach((idPath) => {
    const referencePaths = idPath.scope.getBinding(idPath.node.name)?.referencePaths ?? [];

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

function removeAllExpressionPropsExcept<T>(expressionPath: NodePath<T> | undefined, propNames: PropNames): void {
  // TODO Object.assign
  const resolvedDeclPath = getDeclaratorPath(expressionPath);
  if (expressionPath?.isObjectExpression()) removeAllPropsExcept(expressionPath, propNames);
  if (resolvedDeclPath) removeAllExpressionPropsExcept(resolvedDeclPath.get('init'), propNames);
}

function cleanUpStoriesOfCallChain(storiesOfPath: NodePath): void {
  let callPath = storiesOfPath;
  do {
    const childCallPath = callPath;
    const { parentPath: memberPath } = childCallPath;
    callPath = memberPath.parentPath;
    if (!memberPath.isMemberExpression()) return;
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

      let refs = [...this.visitedTopPaths];
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

export const storyVisitor: TraverseOptions<VisitorState> = {
  ExportDefaultDeclaration(defaultPath) {
    const defaultDeclaration = defaultPath.get('declaration');
    const declaratorPath = getDeclaratorPath(defaultDeclaration);
    const kindPath = declaratorPath
      ? getKindObjectNodePath(declaratorPath.get('init'))
      : getKindObjectNodePath(defaultDeclaration);
    if (!kindPath) return;

    this.visitedTopPaths.add(defaultPath);

    removeAllPropsExcept(kindPath, kindProps);

    if (!declaratorPath) return;

    removeAllPropAssignsExcept(getPropertyAssignmentPaths(getIdentifiers([declaratorPath])), kindProps);
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
      replaceStoryFnToNoop(declarations);
      storyFnPropAssigns = getPropertyAssignmentPaths(getIdentifiers(declarations));
    } else if (declarationPath.isFunctionDeclaration()) {
      declarationPath.get('body').replaceWith(t.blockStatement([]));
      storyFnPropAssigns = getPropertyAssignmentPaths(getIdentifiers(declarationPath));
    }
    removeAllPropAssignsExcept(storyFnPropAssigns, storyProps);
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
};
