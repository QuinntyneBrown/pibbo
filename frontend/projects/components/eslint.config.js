// @ts-check
const { defineConfig } = require('eslint/config');
const rootConfig = require('../../eslint.config.js');

module.exports = defineConfig([
  ...rootConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@pibbo/domain', '@pibbo/domain/*', '@pibbo/pibbo', '@pibbo/pibbo/*'],
              message: 'components depends on api for types only (AGENTS.md dependency direction).',
            },
            {
              group: ['@pibbo/api', '@pibbo/api/*'],
              allowTypeImports: true,
              message: 'components imports types only from api; it injects no app token.',
            },
            {
              group: ['@angular/router'],
              message: 'A presentation component injects no router.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='Math'][property.name='random']",
          message: 'Inject a RandomSource.',
        },
        { selector: "NewExpression[callee.name='Date']", message: 'Inject a Clock.' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'pb',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'pb',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    rules: {},
  },
]);
