'use strict';

const ora = require('ora');
const PublishApp = require('../classes/publish/app');
const PublishDependency = require('../classes/publish/dependency');
const { resolvePath, logger } = require('../utils');

const assetsPath = resolvePath('./assets.json').pathname;
const assets = require(assetsPath);

exports.command = 'publish [name] [version]';

exports.aliases = ['p'];

exports.describe = `Publish an apps dependencies based on local assets.json file or publish an NPM package by given name and version.`;

exports.builder = yargs => {
    yargs
        .positional('name', {
            describe: 'Optional NPM package name.',
            type: 'string'
        })
        .positional('version', {
            describe:
                'Optional NPM package version. Must be provided if "name" is given.',
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
        'dry-run': {
            alias: 'd',
            describe:
                'Terminates the publish early (before upload) and provides information about created bundles for inspection.',
            default: false
        },
        js: {
            describe:
                'Specify the path on local disk to JavaScript client side assets relative to the current working directory.',
            default: assets.js.input
        },
        css: {
            describe:
                'Specify the path on local disk to CSS client side assets relative to the current working directory.',
            default: assets.css.input
        }
    });
};

exports.handler = async function(argv) {
    const spinner = ora().start();
    let success = false;

    try {
        const options = { logger: logger(spinner), ...argv };
        if (argv.name && argv.version) {
            success = await new PublishDependency(options).run();
        } else {
            success = await new PublishApp({
                name: assets.name,
                version: assets.version,
                ...options
            }).run();
        }
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
