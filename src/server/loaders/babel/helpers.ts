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

function cleanUpStoryProps(storyPropAssign: NodePath<t.AssignmentExpression>): void {
  const rightPath = storyPropAssign.get('right');
  if (!rightPath?.isObjectExpression()) return;

  removeAllPropsExcept(rightPath, ['name', ['parameters', 'creevey', 'docsOnly']]);
}

function cleanUpStoriesOfCallChain(storiesOfPath: NodePath): void {
  let callPath = storiesOfPath;
  do {
    const childCallPath = callPath;
    const { parentPath: memberPath } = childCallPath;
    const propPath = memberPath.get('property');
    callPath = memberPath.parentPath;
    if (!memberPath.isMemberExpression() || !callPath.isCallExpression()) return;
    if (!Array.isArray(propPath) && propPath.isIdentifier({ name: 'add' })) {
      const [, storyPath, parametersPath] = callPath.get('arguments');
      storyPath.replaceWith(t.arrowFunctionExpression([], t.blockStatement([])));
      if (parametersPath?.isObjectExpression()) removeAllPropsExcept(parametersPath, ['creevey']);
    }
    if (!Array.isArray(propPath) && propPath.isIdentifier({ name: 'addDecorator' })) {
      callPath.replaceWith(childCallPath);
    }
    if (!Array.isArray(propPath) && propPath.isIdentifier({ name: 'addParameters' })) {
      const [parametersPath] = callPath.get('arguments');
      if (parametersPath?.isObjectExpression()) removeAllPropsExcept(parametersPath, ['creevey']);
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
  },
  CallExpression(rootCallPath) {
    const rootPath = findRootPath(rootCallPath);
    if (rootCallPath.get('callee').isIdentifier({ name: 'configure' })) {
      if (rootPath) this.visitedTopPaths.add(rootPath);
      return;
    }
    if (rootCallPath.get('callee').isIdentifier({ name: 'addDecorator' })) {
      rootCallPath.remove();
      return;
    }
    if (rootCallPath.get('callee').isIdentifier({ name: 'addParameters' })) {
      const [argPath] = rootCallPath.get('arguments');
      if (!argPath || !argPath.isObjectExpression()) return;
      if (rootPath) this.visitedTopPaths.add(rootPath);
      removeAllPropsExcept(argPath, ['creevey']);
      return;
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

export const storyVisitor: TraverseOptions<VisitorState> = {
  ExportDefaultDeclaration(defaultPath) {
    const defaultDeclaration = defaultPath.get('declaration');
    let kindPath = getKindObjectNodePath(defaultDeclaration);
    const declaratorPath = getDeclaratorPath(defaultDeclaration);
    if (declaratorPath) {
      const kindInitPath = declaratorPath.get('init');
      if (!Array.isArray(kindInitPath)) kindPath = getKindObjectNodePath(kindInitPath);
    }
    if (!kindPath) return;

    this.visitedTopPaths.add(defaultPath);

    removeAllPropsExcept(kindPath, ['title', 'id', ['parameters', 'creevey'], 'includeStories', 'excludeStories']);

    if (declaratorPath) {
      const idPath = declaratorPath.get('id');
      if (!idPath.isIdentifier()) return;
      const kindPropAssigns = getPropertyAssignmentPaths([idPath]);
      for (const [assignPath, props] of kindPropAssigns?.entries() ?? []) {
        const [first, second] = props;
        if (first == 'title' || first == 'id' || first == 'includeStories' || first == 'excludeStories') continue;
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
      storyFnPropAssigns = getPropertyAssignmentPaths(
        declarations
          .map((decl) => {
            const idPath = decl.get('id');
            return idPath.isIdentifier() ? idPath : null;
          })
          .filter(isDefined),
      );
    } else if (declarationPath.isFunctionDeclaration()) {
      const idPath = declarationPath.get('id');
      declarationPath.get('body').replaceWith(t.blockStatement([]));
      if (idPath.isIdentifier()) storyFnPropAssigns = getPropertyAssignmentPaths([idPath]);
    }
    // TODO Simplify like this
    // removeAllPropAssignsExcept(..., ['storyName', ['story', 'name', ['parameters', 'creevey', 'docsOnly']], ['parameters', 'creevey', 'docsOnly']])
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
            removeAllPropsExcept(rightPath, ['creevey', 'docsOnly']);
          } else if (third != 'creevey' && third != 'docsOnly') assignPath.remove();
        } else assignPath.remove();
      } else if (first == 'parameters') {
        if (!second) {
          const rightPath = assignPath.get('right');
          if (!rightPath?.isObjectExpression()) continue;
          removeAllPropsExcept(rightPath, ['creevey', 'docsOnly']);
        } else if (second != 'creevey' && second != 'docsOnly') assignPath.remove();
      } else assignPath.remove();
    }
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
