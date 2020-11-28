import { getOptions, OptionObject } from 'loader-utils';
import { validate } from 'schema-utils';
import { JSONSchema7 } from 'schema-utils/declarations/validate';
import { parse } from '@babel/parser';
import traverse, { NodePath, Binding } from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { loader } from 'webpack';

// TODO Babel lack of some method types
interface ExtendedNodePath<T = t.Node> extends NodePath<T> {
  isTSAsExpression(this: NodePath<T>): this is NodePath<t.TSAsExpression>;
}

function tryParse(source: string, options: OptionObject): { ast?: t.File; done: boolean } {
  try {
    return {
      // TODO maybe replace sourceType to unambiguous
      // TODO minimal plugins setup
      ast: parse(source, {
        sourceType: 'module',
        plugins: ['classProperties', 'decorators-legacy', 'jsx', 'typescript'],
      }),
      done: true,
    };
  } catch (error) {
    if (options.debug) console.log(error);
    return { done: false };
  }
}

function getPropertyPath(path: NodePath<t.ObjectExpression>, name: string): NodePath<t.ObjectProperty> | undefined {
  const propertyPath = path
    .get('properties')
    .find((propPath) => propPath.isObjectProperty() && t.isIdentifier(propPath.node.key, { name }));
  return propertyPath?.isObjectProperty() ? propertyPath : undefined;
}

function getDeclaratorPath<T>(path: NodePath<T>): NodePath<t.VariableDeclarator> | undefined {
  if (path.isIdentifier()) {
    // TODO If kind var has `as` keyword (`const Kind = {} as Meta`)
    const { path: bindingPath } = path.scope.getBinding(path.node.name) ?? {};
    if (bindingPath?.isVariableDeclarator()) return bindingPath;
  }
}

function getKindObjectNodePath<T>(path: NodePath<T>): NodePath<t.ObjectExpression> | undefined {
  if (path.isObjectExpression()) {
    return getPropertyPath(path, 'title') ? path : undefined;
  } else if ((path as ExtendedNodePath<T>).isTSAsExpression()) {
    const pathExpression = ((path as NodePath<unknown>) as NodePath<t.TSAsExpression>).get('expression');
    return pathExpression.isObjectExpression() && getPropertyPath(pathExpression, 'title') ? pathExpression : undefined;
  }
}

function removeAllPropsExcept(path: NodePath<t.ObjectExpression>, propNames: string[]): void {
  (path.get('properties') as NodePath[])
    .filter(
      (propPath) =>
        !propPath.isObjectProperty() || !propNames.some((name) => t.isIdentifier(propPath.node.key, { name })),
    )
    .forEach((propPath) => propPath.remove());
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
      const { referencePaths } = path.scope.getBinding(id.name) ?? {};

      if (!referencePaths) return;

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
  const rightPath = storyPropAssign.get('right') as NodePath;
  if (!rightPath?.isObjectExpression()) return;

  removeAllPropsExcept(rightPath, ['name', 'parameters']);
  const storyParametersPath = getPropertyPath(rightPath, 'parameters')?.get('value');
  if (storyParametersPath?.isObjectExpression()) {
    removeAllPropsExcept(storyParametersPath, ['creevey']);
  }
}

function recursivelyRemoveUnreferencedBindings(path: NodePath<t.Program>): void {
  const getUnreferencedBindings = (): Binding[] => {
    // @ts-expect-error: I don't know what this method do, but it allow get correct bindings
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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

function minifyStories(ast: t.File, source: string): string {
  let isTransformed = false;
  const visited = new Set();

  traverse(ast, {
    ExportDefaultDeclaration(defaultPath) {
      const defaultDeclaration = defaultPath.get('declaration');
      let kindPath = getKindObjectNodePath(defaultDeclaration);
      const declaratorPath = getDeclaratorPath(defaultDeclaration);
      if (declaratorPath) {
        const kindInitPath = declaratorPath.get('init');
        if (!Array.isArray(kindInitPath)) kindPath = getKindObjectNodePath(kindInitPath);
      }
      if (!kindPath) return;
      isTransformed = true;
      removeAllPropsExcept(kindPath, ['title', 'parameters']);
      const kindParametersPath = getPropertyPath(kindPath, 'parameters')?.get('value');
      if (kindParametersPath?.isObjectExpression()) {
        removeAllPropsExcept(kindParametersPath, ['creevey']);
      }
      if (declaratorPath) {
        const kindPropAssigns = getPropertyAssignmentPaths(defaultPath, [declaratorPath.node]);
        for (const [assignPath, props] of kindPropAssigns?.entries() ?? []) {
          const [first, second] = props;
          if (first == 'title') continue;
          else if (first == 'parameters') {
            if (!second) {
              const rightPath = assignPath.get('right') as NodePath;
              if (!rightPath?.isObjectExpression()) continue;
              removeAllPropsExcept(rightPath, ['creevey']);
            } else if (second != 'creevey') assignPath.remove();
          } else assignPath.remove();
        }
      }
      defaultPath.parentPath.traverse({
        ExportNamedDeclaration(namedPath) {
          const namedDeclaration = namedPath.node.declaration as t.Node;
          if (!t.isVariableDeclaration(namedDeclaration)) return;
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
                  const rightPath = assignPath.get('right') as NodePath;
                  if (!rightPath?.isObjectExpression()) continue;
                  removeAllPropsExcept(rightPath, ['creevey']);
                } else if (third != 'creevey') assignPath.remove();
              } else assignPath.remove();
            } else if (first == 'parameters') {
              if (!second) {
                const rightPath = assignPath.get('right') as NodePath;
                if (!rightPath?.isObjectExpression()) continue;
                removeAllPropsExcept(rightPath, ['creevey']);
              } else if (second != 'creevey') assignPath.remove();
            } else assignPath.remove();
          }
        },
      });
    },
    ExportNamedDeclaration(namedPath) {
      let hasDefaultExport = false;
      namedPath.parentPath.traverse({
        ExportDefaultDeclaration() {
          hasDefaultExport = true;
        },
      });
      if (hasDefaultExport) return;
      isTransformed = true;
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
    CallExpression(path) {
      if (path.get('callee').isIdentifier({ name: 'addDecorator' })) {
        isTransformed = true;
        path.remove();
        return;
      }
      if (path.get('callee').isIdentifier({ name: 'addParameters' })) {
        const [argPath] = path.get('arguments');
        if (!argPath || !argPath.isObjectExpression()) return;
        isTransformed = true;
        removeAllPropsExcept(argPath, ['creevey']);
        return;
      }
      if (!path.get('callee').isIdentifier({ name: 'storiesOf' }) || visited.has(path)) return;
      isTransformed = true;
      visited.add(path);
      let callPath = path as NodePath;
      do {
        const childCallPath = callPath;
        const { parentPath: memberPath } = childCallPath;
        const propPath = memberPath.get('property');
        callPath = memberPath.parentPath;
        if (!memberPath.isMemberExpression() || !callPath.isCallExpression()) return;
        if (!Array.isArray(propPath) && propPath.isIdentifier({ name: 'add' })) {
          const [, storyPath, parametersPath] = callPath.get('arguments') as NodePath[];
          storyPath.replaceWith(t.arrowFunctionExpression([], t.blockStatement([])));
          if (parametersPath?.isObjectExpression()) getPropertyPath(parametersPath, 'decorators')?.remove();
        }
        if (!Array.isArray(propPath) && propPath.isIdentifier({ name: 'addDecorator' })) {
          callPath.replaceWith(childCallPath);
        }
      } while (callPath.parentPath != null);
    },
  });

  if (isTransformed) {
    traverse(ast, {
      TSInterfaceDeclaration(path) {
        path.remove();
      },
      Program: {
        exit(path) {
          recursivelyRemoveUnreferencedBindings(path);

          path.traverse({
            ImportDeclaration(path) {
              if (path.node.specifiers.length == 0) path.remove();
            },
          });
        },
      },
    });

    return generate(ast, { retainLines: true }).code;
  }

  return source;
}

const schema: JSONSchema7 = {
  type: 'object',
  properties: {
    debug: { type: 'boolean' },
  },
};

const defaultOptions = { debug: false };

export default function (this: loader.LoaderContext | void, source: string): string {
  const options = this ? getOptions(this) || defaultOptions : defaultOptions;
  validate(schema, options, { name: 'Creevey Stories Loader' });
  const { ast, done } = tryParse(source, options);

  if (!done || !ast) return source;

  try {
    return minifyStories(ast, source);
  } catch (error) {
    if (options.debug) console.log(error);
    // TODO Debug output
    return source;
  }
}
