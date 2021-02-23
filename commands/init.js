'use strict';

const { join } = require('path');
const fs = require('fs');
const ora = require('ora');
const { logger } = require('../utils');

exports.command = 'init';

exports.aliases = ['i'];

exports.describe = `Creates a new default "eik.json" file and saves it to the current working directory
    Override default "eik.json" fields using command line flags --server, --name, --major, --js and --css`;

exports.builder = (yargs) => {
    yargs.example('eik init');
    yargs.example('eik init --cwd /path/to/dir');
    yargs.example(
        'eik init --server https://assets.myserver.com --major 2 --name my-app --js ./scripts.js --css ./styles.css',
    );
    yargs.example('eik init --debug');

    yargs.options({
        server: {
            alias: 's',
            describe: `Specify asset server field in "eik.json".
                This the URL to an Eik asset server
                Eg. --server https://assets.myeikserver.com`,
            default: '',
        },
        cwd: {
            alias: 'c',
            describe: `Alter the current working directory
                Defaults to the directory where the command is being run.
                This affects where the generated "eik.json" file will be saved.
                Eg. --cwd /path/to/save/to`,
            default: process.cwd(),
        },
        version: {
            alias: 'v',
            describe: `Specify the semver version field in "eik.json". Eg. --version 1.0.0`,
            default: '1.0.0',
        },
        name: {
            alias: 'n',
            describe: `Specify the app name field in "eik.json".
                Eg. --name my-great-app`,
            default: '',
        },
        debug: {
            describe: 'Logs additional messages during command run',
            default: false,
            type: 'boolean',
        },
    });
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    const { name, version, server, cwd, debug } = argv;
    const pathname = join(cwd, './eik.json');
    const log = logger(spinner, debug);
    let assetFileExists = false;

    try {
        log.debug(
            `Checking for existing "eik.json" file in directory (${cwd})`,
        );
        try {
            const st = fs.statSync(pathname);
            if (st.isFile()) {
                assetFileExists = true;
            }
        } catch (err) {
            // noop
        }

        if (assetFileExists) {
            throw new Error(
                `An "eik.json" file already exists in directory. File will not be written`,
            );
        }

        log.debug(`Writing "eik.json" to directory (${cwd})`);
        fs.writeFileSync(
            pathname,
            JSON.stringify(
                {
                    name,
                    version,
                    server,
                    files: {},
                },
                null,
                2,
            ),
        );

        log.info(`"eik.json" successfully written to directory`);
    } catch (err) {
        log.warn(err.message);
    }
    spinner.text = '';
    spinner.stopAndPersist();
};
