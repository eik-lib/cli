'use strict';

const ora = require('ora');
const { readFileSync } = require('fs');
const Login = require('../classes/login');
const { resolvePath, logger } = require('../utils');

exports.command = 'login <key>';

exports.aliases = [];

exports.describe = `Authenticate with an Eik server`;

exports.builder = (yargs) => {
    let assets = {};
    try {
        const assetsPath = resolvePath('./assets.json').pathname;
        assets = JSON.parse(readFileSync(assetsPath));
    } catch (err) {
        // noop
    }

    yargs.positional('key', {
        describe: 'Login access key',
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
    });
};

exports.handler = async (argv) => {
    const spinner = ora().start('working...');
    let success = false;
    const { debug } = argv;

    try {
        success = await new Login({
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
