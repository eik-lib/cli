'use strict';

const readline = require("readline");
const ora = require('ora');
const { readFileSync } = require('fs');
const Login = require('../classes/login');
const { resolvePath, logger } = require('../utils');

exports.command = 'login';

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

    yargs.options({
        key: {
            alias: 'k',
            describe: 'Login access key',
            type: 'string',
            default: '',
        },
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
    let success = false;
    const { debug, key } = argv;
    let k = key;

    if (!k) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        await new Promise((resolve) => {
            rl.question('Enter login key > ', (input) => {
                k = input;
                rl.close();
                resolve();
            });
        });
    }

    const spinner = ora().start('working...');

    try {
        success = await new Login({
            logger: logger(spinner, debug),
            ...argv,
            key: k,
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
