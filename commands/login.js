'use strict';

const homedir = require('os').homedir();
const readline = require('readline');
const ora = require('ora');
const Login = require('../classes/login');
const {
    logger,
    readJSON,
    writeJSON,
} = require('../utils');

exports.command = 'login';

exports.aliases = [];

exports.describe = `Authenticate against an Eik server and save the returned token to an .eikrc file in the users home directory.
    You can specify key and server values to authenticate against using the --key and --server flags which will then bypass login prompts
    It is possible to be authenticated against multiple asset servers simultaneously. Simply call "eik login" multiple times.`;

exports.builder = (yargs) => {
    yargs.example('eik login --server https://assets.myserver.com');
    yargs.example(
        'eik login --server https://assets.myserver.com --key ######',
    );
    yargs.example('eik login --server https://assets.myserver.com --debug');

    yargs.options({
        server: {
            alias: 's',
            describe: `Eik server address
                Specify location of the Eik asset server to authenticate against.
                If this flag is not specified, a prompt will be used to ask for the server address to be input
                Eg. --server https://assets.myeikserver.com`,
            type: 'string',
            default: '',
        },
        key: {
            alias: 'k',
            describe: `Login access key. 
                This is a passkey for a given user account and needs to be configured on the server.
                If this flag is not specifed, a prompt will be used to ask for the key to be input.
                Eg. --key ########`,
            type: 'string',
            default: '',
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
    let s = server;
    let rl = null;

    if (!s || !k) {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }

    if (!s) {
        await new Promise((resolve) => {
            rl.question('Enter Eik server address > ', (input) => {
                s = input;
                resolve();
            });
        });
    }

    if (!k) {
        await new Promise((resolve) => {
            rl.question('Enter login key > ', (input) => {
                k = input;
                resolve();
            });
        });
    }

    if (rl) rl.close();

    const spinner = ora({ stream: process.stdout }).start('working...');

    try {
        const token = await new Login({
            logger: logger(spinner, debug),
            debug,
            key: k,
            server: s,
        }).run();

        if (token) {
            const meta = await readJSON({ cwd: homedir, filename: '.eikrc' });

            const tokens = new Map(meta.tokens);
            tokens.set(s, token);
            meta.tokens = Array.from(tokens);

            await writeJSON(meta, { cwd: homedir, filename: '.eikrc' });
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
