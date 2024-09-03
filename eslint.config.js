import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
// @ts-expect-error There is no types in this package
import react from 'eslint-plugin-react';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

// TODO Add import plugin after it migrated to eslint 9.x
const config = tseslint.config(
  { ignores: ['dist/*', 'report/*', 'scripts/*'] },
  js.configs.recommended,
  prettierRecommended,
  /* eslint-disable-next-line */
  react.configs.flat.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      ecmaVersion: 2021,
      sourceType: 'module',

      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.{c,}js'],
          defaultProject: 'tsconfig.json',
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/prop-types': 'off',
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
