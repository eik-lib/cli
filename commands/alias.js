'use strict';

const ora = require('ora');
const { readFileSync } = require('fs');
const Alias = require('../classes/alias');
const { resolvePath, logger } = require('../utils');

exports.command = 'alias <type> <name> <version> <alias>';

exports.aliases = ['a'];

exports.describe = `Create a semver major alias for an import map or package as identified by its name and version.`;

exports.builder = yargs => {
    const cwd = yargs.argv.cwd || yargs.argv.c || process.cwd();
    
    let assets = {};
    try {
        const assetsPath = resolvePath('./assets.json', cwd).pathname;
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
        .positional('type', {
            describe:
                'Resource type to perform alias on. Either "pkg" for a package or "map" for an import map',
            type: 'string',
        })
        .positional('name', {
            describe:
                'Name matching either package or import map name depending on type given',
            type: 'string',
        })
        .positional('version', {
            describe:
                'Version matching either package or import map version depending on type given',
            type: 'string',
        })
        .positional('alias', {
            describe:
                'Alias for a semver version. Must be the semver major component of version. Eg. 1.0.0 should be given as 1',
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
    const spinner = ora().start('working...');
    let success = false;
    const { debug } = argv;

    try {
        success = await new Alias({
            logger: logger(spinner, debug),
            ...argv,
        }).run();
    } catch (err) {
        logger.warn(err.message);
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
