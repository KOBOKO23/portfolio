import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Language options with type-aware parsing
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React + hooks + a11y for all source files
  {
    files: ['app/**/*.{ts,tsx}', '__mocks__/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      'react/prop-types': 'off',
      'react/display-name': 'off',

      // Hooks
      ...reactHooks.configs.recommended.rules,

      // Accessibility
      ...jsxA11y.configs.recommended.rules,
      'jsx-a11y/anchor-is-valid': 'off',       // react-router Link handles this
      'jsx-a11y/anchor-has-content': 'warn',   // icon-only links need aria-label; warn not block

      // Prose — apostrophes and quotes in JSX text are readable and safe; HTML escaping is pedantic
      'react/no-unescaped-entities': 'off',

      // TypeScript — enforce correctness, relax style rules needing large refactors
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Async event handlers are valid React patterns — allow void return in JSX attrs
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],

      // Empty arrow functions are common for noop props
      '@typescript-eslint/no-empty-function': ['warn', { allow: ['arrowFunctions'] }],

      // Floating promises — require explicit void or await
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],

      // Nullish coalescing is better than || but fixing 75 instances risks semantic changes — warn only
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',

      // Type-unsafe rules — warn until API responses are fully typed
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',

      // Redundant union constituents in catch blocks etc.
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
    },
  },

  // Test files — relax rules that conflict with test patterns
  {
    files: ['app/**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Config files — disable type-aware rules (they live outside app tsconfig paths)
  {
    files: ['*.config.{js,ts,mjs}', 'test-setup.ts', 'postcss.config.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },

  // Prettier must be last — disables formatting rules that conflict
  prettier,

  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'app/components/ui/**', // shadcn/ui generated components — not hand-edited
    ],
  },
);
