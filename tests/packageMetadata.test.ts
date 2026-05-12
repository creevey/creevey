import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

interface PackageJson {
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly engines?: {
    readonly node?: string;
  };
}

const workspaceRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(workspaceRoot, 'package.json');
const nodeVersionPath = path.join(workspaceRoot, '.node-version');

const readPackageJson = (): PackageJson => JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson;

describe('package metadata', () => {
  test('aligns Storybook package versions and Node requirements', () => {
    const packageJson = readPackageJson();
    const devDependencies = packageJson.devDependencies ?? {};
    const expectedStorybookVersion = '^10.3.6';

    expect(devDependencies.storybook).toBe(expectedStorybookVersion);
    expect(devDependencies['@storybook/addon-docs']).toBe(expectedStorybookVersion);
    expect(devDependencies['@storybook/react-vite']).toBe(expectedStorybookVersion);
    expect(devDependencies['eslint-plugin-storybook']).toBe(expectedStorybookVersion);
    expect(devDependencies['@chromatic-com/storybook']).toBe('^5.1.2');
    expect(packageJson.engines?.node).toBe('>=20.19.6');
    expect(readFileSync(nodeVersionPath, 'utf8').trim()).toBe('v20.19.6');
  });
});
