'use strict';

const homedir = require('os').homedir();
const readline = require('readline');
const ora = require('ora');
const { readFileSync } = require('fs');
const Login = require('../classes/login');
const {
    resolvePath,
    logger,
    readMetaFile,
    writeMetaFile,
} = require('../utils');

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
    const { debug, key, server } = argv;
    let k = key;

    if (!k && server) {
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

    const spinner = ora({ stream: process.stdout }).start('working...');

    try {
        const token = await new Login({
            logger: logger(spinner, debug),
            ...argv,
            key: k,
        }).run();

        if (token) {
            const meta = await readMetaFile({ cwd: homedir });

            const tokens = new Map(meta.tokens);
            tokens.set(server, token);
            meta.tokens = Array.from(tokens);

            await writeMetaFile(meta, { cwd: homedir });
            success = true;
        }
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
