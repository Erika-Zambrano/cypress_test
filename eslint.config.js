const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const cypressPlugin = require('eslint-plugin-cypress');
const chaiFriendlyPlugin = require('eslint-plugin-chai-friendly');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'cypress/videos/**',
      'cypress/screenshots/**',
      'cypress/downloads/**',
      'docs/**',
    ],
  },
  {
    files: ['cypress/**/*.ts', 'cypress.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: cypressPlugin.configs.recommended.languageOptions.globals,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      cypress: cypressPlugin,
      'chai-friendly': chaiFriendlyPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...cypressPlugin.configs.recommended.rules,
      // Chai's BDD assertions (e.g. `expect(x).to.exist`) end in a bare property
      // access, which looks like an unused expression but isn't.
      '@typescript-eslint/no-unused-expressions': 'off',
      'chai-friendly/no-unused-expressions': 'error',
    },
  },
  prettierConfig,
];
