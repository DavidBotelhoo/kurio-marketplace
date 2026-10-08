import js from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import prettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y-x'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'lighthouse-reports',
    'public/mockServiceWorker.js',
    'src/routeTree.gen.ts',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.configs.recommended,
      pluginQuery.configs['flat/recommended'],
      pluginRouter.configs['flat/recommended'],
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Route files export `Route`; TanStack's code splitting keeps HMR working.
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true, allowExportNames: ['Route'] },
      ],
      // Scrollable regions (role="region" + name) must be keyboard-focusable.
      'jsx-a11y-x/no-noninteractive-tabindex': [
        'error',
        {
          tags: [],
          roles: ['tabpanel', 'region'],
          allowExpressionValues: true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      // TanStack Router control flow: throw redirect() / notFound().
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            {
              from: 'package',
              package: '@tanstack/router-core',
              name: ['Redirect', 'NotFoundError'],
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'cn',
              message:
                'Import cn from "@/lib/utils": it knows the custom theme scales.',
            },
          ],
        },
      ],
    },
  },
  {
    // Playwright tests run in Node; page.evaluate callbacks run in the page.
    files: ['tests/**/*.ts', 'playwright.config.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  prettier,
])
