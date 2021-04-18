module.exports = {
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        '@semantic-release/changelog',
        [
            '@semantic-release/npm',
            {
                tarballDir: 'release',
            },
        ],
        [
            '@semantic-release/github',
            {
                assets: 'release/*.tgz',
            },
        ],
        [
            'semantic-release-slack-bot',
            {
                notifyOnSuccess: false,
                notifyOnFail: false,
                packageName: '@eik/cli',
                branchesConfig: [
                    {
                        pattern: 'master',
                        notifyOnSuccess: true,
                        onSuccessTemplate: {
                            text: '$package_name $npm_package_version is now available - $repo_url',
                        },
                    },
                    {
                        pattern: 'alpha',
                        notifyOnSuccess: true,
                        onSuccessTemplate: {
                            text: '$package_name $npm_package_version (pre-release) is now available - $repo_url',
                        },
                    },
                    {
                        pattern: 'beta',
                        notifyOnSuccess: true,
                        onSuccessTemplate: {
                            text: '$package_name $npm_package_version (pre-release) is now available - $repo_url',
                        },
                    },
                    {
                        pattern: 'next',
                        notifyOnSuccess: true,
                        onSuccessTemplate: {
                            text: '$package_name $npm_package_version (pre-release) is now available - $repo_url',
                        },
                    },
                ]
            }
        ],
        '@semantic-release/git',
    ],
    preset: 'angular',
    branches: [
        { name: 'master' },
        { name: 'alpha', prerelease: true },
        { name: 'beta', prerelease: true },
        { name: 'next', prerelease: true },
    ],
};
