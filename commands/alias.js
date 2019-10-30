'use strict';

const ora = require('ora');
const Alias = require('../classes/alias');
const { resolvePath, logger } = require('../utils');

exports.command = 'alias <type> <name> <version> <alias>';

exports.aliases = ['a'];

exports.describe = `Create a semver major alias for an import map or package as identified by its name and version.`;

exports.builder = yargs => {
    const assetsPath = resolvePath('./assets.json').pathname;
    const assets = require(assetsPath);

    yargs
        .positional('type', {
            describe:
                'Resource type to perform alias on. Either "pkg" for a package or "map" for an import map',
            type: 'string'
        })
        .positional('name', {
            describe:
                'Name matching either package or import map name depending on type given',
            type: 'string'
        })
        .positional('version', {
            describe:
                'Version matching either package or import map version depending on type given',
            type: 'string'
        })
        .positional('alias', {
            describe:
                'Alias for a semver version. Must be the semver major component of version. Eg. 1.0.0 should be given as 1',
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
        }
    });
};

exports.handler = async function(argv) {
    const spinner = ora().start();
    let success = false;

    try {
        success = await new Alias({ logger: logger(spinner), ...argv }).run();
    } catch (err) {
        logger.warn(err.message);
    }

    if (success) {
        spinner.succeed('🤘');
    } else {
        spinner.fail('🥺');
        process.exit(1);
    }
};
