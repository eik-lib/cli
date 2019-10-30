'use strict';

const ora = require('ora');
const PublishApp = require('../classes/publish/app');
const { resolvePath, logger } = require('../utils');

const assetsPath = resolvePath('./assets.json').pathname;
const assets = require(assetsPath);

exports.command = 'publish';

exports.aliases = ['p', 'pub'];

exports.describe = `Publish an apps dependencies based on local assets.json file.`;

exports.builder = yargs => {
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
        },
        name: {
            describe: 'Specify the app name.',
            default: assets.name
        },
        version: {
            describe: 'Specify the app version.',
            default: assets.version
        }
    });
};

exports.handler = async function(argv) {
    const spinner = ora().start();
    let success = false;

    try {
        const options = { logger: logger(spinner), ...argv };
        success = await new PublishApp(options).run();
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
