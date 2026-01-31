import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import perfectionist from 'eslint-plugin-perfectionist';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
      'vite-env.d.ts',
    ],
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      import: importPlugin,
      perfectionist,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': false,
          'ts-nocheck': false,
          'ts-check': false,
        },
      ],
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',

      'no-magic-numbers': 'off',
      'max-lines-per-function': 'off',
      complexity: 'off',
      'max-depth': 'off',
      'max-nested-callbacks': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-useless-fragment': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react/self-closing-comp': 'warn',
      'react/jsx-boolean-value': ['warn', 'never'],
      'react/jsx-no-constructed-context-values': 'warn',
      'react/no-array-index-key': 'warn',
      'react/no-unstable-nested-components': 'warn',
      'react/hook-use-state': 'warn',
      'react/jsx-no-leaked-render': 'off',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',

      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',

      'import/no-duplicates': 'error',
      'import/no-cycle': ['error', { maxDepth: 3 }],
      'import/no-self-import': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-useless-path-segments': 'error',
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-named-imports': 'off',
      'perfectionist/sort-exports': 'off',
      'perfectionist/sort-named-exports': 'off',
      'perfectionist/sort-interfaces': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-enums': 'off',
      'perfectionist/sort-jsx-props': 'off',
      'perfectionist/sort-classes': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/shared/utils/core/*', '!@/shared/utils/core/index'],
              message: '请从 @/shared/utils 或 @/shared/utils/core 导入',
            },
            {
              group: ['@/shared/utils/math/*', '!@/shared/utils/math/index'],
              message: '请从 @/shared/utils 或 @/shared/utils/math 导入',
            },
            {
              group: [
                '@/shared/utils/media/*',
                '@/shared/utils/media/**/*',
                '!@/shared/utils/media/index',
                '!@/shared/utils/media/*/index',
              ],
              message: '请从 @/shared/utils 或 @/shared/utils/media 导入',
            },
            {
              group: ['@/shared/utils/coordinates/*', '!@/shared/utils/coordinates/index'],
              message: '请从 @/shared/utils 或 @/shared/utils/coordinates 导入',
            },
            {
              group: ['@/shared/utils/presets/*', '!@/shared/utils/presets/index'],
              message: '请从 @/shared/utils 或 @/shared/utils/presets 导入',
            },
          ],
        },
      ],

      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE'],
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
      ],

      'no-empty': 'off',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
      ],
      'no-console': 'off',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'warn',
      'object-shorthand': 'warn',
      eqeqeq: ['error', 'always'],
      'no-nested-ternary': 'warn',
      'no-unneeded-ternary': 'warn',
      'no-lonely-if': 'warn',
      'no-else-return': 'warn',
      'prefer-destructuring': ['warn', { array: false, object: true }],
      'no-param-reassign': ['error', { props: false }],
    },
  },
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.constants.ts',
      '**/constants.ts',
      'src/shared/constants/*.ts',
      'src/shared/utils/presets/*.ts',
      'src/features/ai/services/*.ts',
      'src/features/depthEditor/*.ts',
      'src/shared/components/ui/ErrorToast.tsx',
    ],
    rules: {
      'no-magic-numbers': 'off',
    },
  }
);
