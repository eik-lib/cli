import config from '@eik/eslint-config';

export default [
    ...config,
    {
        rules: {
            'no-unused-vars': 'off',
        },
    },
];
