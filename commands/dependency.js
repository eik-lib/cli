'use strict';

const ora = require('ora');
const PublishDependency = require('../classes/publish/dependency');
const { resolvePath, logger } = require('../utils');

exports.command = 'dependency <name> <version>';

exports.aliases = ['dep', 'd'];

exports.describe = `Publish an NPM package to server by given name and version.`;

exports.builder = yargs => {
    const assetsPath = resolvePath('./assets.json').pathname;
    const assets = require(assetsPath);

    yargs
        .positional('name', {
            describe: 'NPM package name.',
            type: 'string'
        })
        .positional('version', {
            describe: 'Semver NPM package version.',
            type: 'string'
        });

    yargs.options({
        server: {
            alias: 's',
            describe: 'Specify location of asset server.',
            default: assets.server || ''
        },
        cwd: {
            alias: 'c',
            describe: 'Alter current working directory.',
            default: process.cwd()
        },
        org: {
            alias: 'o',
            describe: 'Provide the organisation context for the command.',
            default: assets.organisation || ''
        },
        map: {
            alias: 'm',
            describe:
                'Provide an array of URLs to import maps that should be used when making bundles',
            default: assets['import-map'] || []
        },
        dryRun: {
            alias: 'd',
            describe:
                'Terminates the publish early (before upload) and provides information about created bundles for inspection.',
            default: false,
            type: 'boolean'
        }
    });
};

exports.handler = async function(argv) {
    const spinner = ora().start();
    let success = false;
    try {
        const options = { logger: logger(spinner), ...argv };
        success = await new PublishDependency(options).run();
    } catch (err) {
        spinner.warn(err.message);
    }

    if (success) {
        spinner.succeed('🤘');
    } else {
        spinner.fail('🥺');
        process.exit(1);
    }
};
