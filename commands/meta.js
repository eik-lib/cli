'use strict';

const ora = require('ora');
const { readFileSync } = require('fs');
const Meta = require('../classes/meta');
const { resolvePath, logger } = require('../utils');

exports.command = 'meta <name> <version>';

exports.aliases = ['show'];

exports.describe = `Retrieve meta information about a package`;

exports.builder = yargs => {
    const assetsPath = resolvePath('./assets.json').pathname;
    const assets = JSON.parse(readFileSync(assetsPath));

    yargs
        .positional('name', {
            describe:
                'Name matching either package or import map name depending on type given',
            type: 'string',
        })
        .positional('version', {
            describe:
                'Version matching either package or import map version depending on type given',
            type: 'string',
        });

    yargs.options({
        server: {
            alias: 's',
            describe: 'Specify location of asset server.',
            default: assets.server || '',
        },
        org: {
            alias: 'o',
            describe: 'Provide the organisation context for the command.',
            default: assets.organisation || '',
        },
        debug: {
            describe: 'Logs additional messages',
            default: false,
            type: 'boolean',
        },
    });
};

exports.handler = async argv => {
    const spinner = ora().start('working...');
    let success = false;
    const { debug } = argv;

    try {
        success = await new Meta({
            logger: logger(spinner, debug),
            ...argv,
        }).run();
    } catch (err) {
        logger.warn(err.message);
    }

    if (success) {
        spinner.text = '';
        spinner.stopAndPersist();
        // eslint-disable-next-line no-console
        console.log(success);
        spinner.text = '';
        spinner.stopAndPersist();
    } else {
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
