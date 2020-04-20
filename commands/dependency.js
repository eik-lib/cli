'use strict';

const ora = require('ora');
const { readFileSync } = require('fs');
const PublishDependency = require('../classes/publish/dependency');
const { resolvePath, logger } = require('../utils');

exports.command = 'dependency <name> <version>';

exports.aliases = ['dep', 'd'];

exports.describe = `Publish an NPM package to server by given name and version.`;

exports.builder = yargs => {
    const cwd = yargs.argv.cwd || yargs.argv.c || process.cwd();

    let assets = {};
    try {
        const assetsPath = resolvePath('./assets.json').pathname;
        assets = JSON.parse(readFileSync(assetsPath));
    } catch (err) {
        // noop
    }

    let meta = {};
    try {
        const metaPath = resolvePath('./.eikrc', cwd).pathname;
        meta = JSON.parse(readFileSync(metaPath));
    } catch (err) {
        // noop
    }

    yargs
        .positional('name', {
            describe: 'NPM package name.',
            type: 'string',
        })
        .positional('version', {
            describe: 'Semver NPM package version.',
            type: 'string',
        });

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
        token: {
            describe: 'Provide a jwt token to be used to authenticate with the Eik server.',
            default: meta.token,
        },
    });
};

exports.handler = async argv => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let success = false;
    const { debug } = argv;

    try {
        const options = { logger: logger(spinner, debug), ...argv };
        success = await new PublishDependency(options).run();
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
