'use strict';

const ora = require('ora');
const Map = require('../classes/publish/map');
const { resolvePath, logger } = require('../utils');

exports.command = 'map <name> <version> <file>';

exports.aliases = ['m'];

exports.describe = `Upload an import map file to the server under a given name and version.`;

exports.builder = yargs => {
    const assetsPath = resolvePath('./assets.json').pathname;
    const assets = require(assetsPath);

    yargs
        .positional('name', {
            describe: 'Import map name.',
            type: 'string'
        })
        .positional('version', {
            describe: 'Import map version.',
            type: 'string'
        })
        .positional('file', {
            describe:
                'Path to import map file on local disk relative to the current working directory.',
            type: 'string',
            normalize: true
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
        success = await new Map({
            logger: logger(spinner),
            ...argv
        }).run();
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
