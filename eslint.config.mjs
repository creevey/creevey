import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import storybook from 'eslint-plugin-storybook';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import { importX, createNodeResolver } from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

const config = tseslint.config(
  { ignores: ['.vscode/*', '.yarn/*', 'dist/*', 'report/*', 'scripts/*', '.pnp.*'] },
  js.configs.recommended,
  prettierRecommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  react.configs.flat.recommended,
  storybook.configs['flat/recommended'],
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.{m,}js', 'src/server/playwright/index-source.mjs'],
          defaultProject: 'tsconfig.json',
        },
      },
    },
    files: ['**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'],
    settings: {
      react: { version: 'detect' },
      'import-x/resolver-next': [createNodeResolver(), createTypeScriptImportResolver()],
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'import-x/no-dynamic-require': 'warn',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
);

export default config;
