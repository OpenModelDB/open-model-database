/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: ['next/core-web-vitals', 'plugin:prettier/recommended', 'plugin:storybook/recommended'],
  plugins: ['prettier', 'unused-imports', 'react-hooks', 'tailwindcss'],
  rules: {
    'prefer-template': 'warn',
    'unused-imports/no-unused-imports': 'error',
    'sort-imports': ['error', {
      ignoreDeclarationSort: true
    }],
    'import/order': ['error', {
      groups: [['builtin', 'external'], 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }],
    'react/jsx-sort-props': ['error', {
      callbacksLast: true,
      shorthandFirst: true
    }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': ['warn', {
      additionalHooks: '(useAsyncEffect)'
    }],
    'tailwindcss/enforces-shorthand': 'warn',
    'tailwindcss/no-contradicting-classname': 'error',
    'tailwindcss/enforces-negative-arbitrary-values': 'warn',
    'tailwindcss/no-arbitrary-value': 'error'
  },
  settings: {
    'import/core-modules': ['electron'],
    'import/resolver': {
      typescript: {} // this loads <rootdir>/tsconfig.json to eslint
    },

    'import/ignore': [/\.(?:css|scss|sass)$/i]
  },
  overrides: [{
    files: ['**/*.ts', '**/*.tsx'],
    extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'plugin:@typescript-eslint/recommended-requiring-type-checking', 'plugin:prettier/recommended'],
    plugins: ['prettier', '@typescript-eslint', 'unused-imports', 'react-hooks'],
    parserOptions: {
      project: './tsconfig.json'
    },
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_'
      }]
    }
  }],
  ignorePatterns: ['next-env.d.ts', 'node_modules/', 'out/', '.next/']
};