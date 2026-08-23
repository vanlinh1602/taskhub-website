import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'scripts/**', 'src/components/ui/**/*.{ts,tsx}'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      '@stylistic': stylistic,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'better-tailwindcss': betterTailwindcss,
      ['simple-import-sort']: simpleImportSortPlugin,
      ['unused-imports']: unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'function', next: 'function' },
        { blankLine: 'always', prev: '*', next: 'function' },
        { blankLine: 'always', prev: 'function', next: '*' },
        { blankLine: 'always', prev: 'export', next: 'export' },
      ],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'better-tailwindcss/enforce-consistent-class-order': ['error', { entryPoint: 'src/index.css' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/no-shadow': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'warn',
      'object-shorthand': ['error', 'always'],
      'no-console': 'warn',
    },
  },
);
