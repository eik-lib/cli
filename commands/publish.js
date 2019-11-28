'use strict';

const ora = require('ora');
const { readFileSync } = require('fs');
const PublishApp = require('../classes/publish/app/index');
const { resolvePath, logger } = require('../utils');

exports.command = 'publish';

exports.aliases = ['p', 'pub'];

exports.describe = `Publish an apps dependencies based on local assets.json file.`;

exports.builder = yargs => {
    const assetsPath = resolvePath('./assets.json').pathname;
    const assets = JSON.parse(readFileSync(assetsPath));

    yargs.options({
        server: {
            alias: 's',
            describe: 'Specify location of asset server.',
            default: assets.server || '',
        },
        cwd: {
            alias: 'c',
            describe: 'Alter current working directory.',
            default: process.cwd(),
        },
        org: {
            alias: 'o',
            describe: 'Provide the organisation context for the command.',
            default: assets.organisation || '',
        },
        map: {
            alias: 'm',
            describe:
                'Provide an array of URLs to import maps that should be used when making bundles',
            default: assets['import-map'] || [],
        },
        dryRun: {
            alias: 'd',
            describe:
                'Terminates the publish early (before upload) and provides information about created bundles for inspection.',
            default: false,
            type: 'boolean',
        },
        debug: {
            describe: 'Logs additional messages',
            default: false,
            type: 'boolean',
        },
        js: {
            describe:
                'Specify the path on local disk to JavaScript client side assets relative to the current working directory.',
            default: assets.js && assets.js.input,
        },
        css: {
            describe:
                'Specify the path on local disk to CSS client side assets relative to the current working directory.',
            default: assets.css && assets.css.input,
        },
        name: {
            describe: 'Specify the app name.',
            default: assets.name,
        },
        version: {
            describe: 'Specify the app version.',
            default: assets.version,
        },
    });
};

exports.handler = async argv => {
    const spinner = ora().start('working...');
    let success = false;
    const { debug } = argv;

    try {
        const options = { logger: logger(spinner, debug), ...argv };
        success = await new PublishApp(options).run();
    } catch (err) {
        spinner.warn(err.message);
    }

    if (success) {
        spinner.text = '';
        spinner.stopAndPersist();
    } else {
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
