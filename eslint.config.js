import js from '@eslint/js';
import babelParser from '@babel/eslint-parser';
import globals from 'globals';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
    js.configs.recommended,
    eslintPluginPrettierRecommended,
    {
        rules: {
            'no-unused-vars': 'off',
        },
        languageOptions: {
            parser: babelParser,
            parserOptions: {
                requireConfigFile: false,
                ecmaVersion: 2020,
                sourceType: 'module',
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2020,
            },
        },
        ignores: ['coverage'],
    },
];
