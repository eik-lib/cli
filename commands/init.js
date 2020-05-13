'use strict';

const fs = require('fs');
const ora = require('ora');
const { logger, resolvePath } = require('../utils');

exports.command = 'init';

exports.aliases = ['i'];

exports.describe = `Creates a new default "assets.json" file and saves it to the current working directory
    Override default "assets.json" fields using command line flags --server, --name, --major, --js and --css`;

exports.builder = (yargs) => {
    yargs.example('eik init');
    yargs.example('eik init --cwd /path/to/dir');
    yargs.example('eik init --server https://assets.myserver.com --major 2 --name my-app --js ./scripts.js --css ./styles.css');
    yargs.example('eik init --debug');

    yargs.options({
        server: {
            alias: 's',
            describe: `Specify asset server field in "assets.json".
                This the URL to an Eik asset server
                Eg. --server https://assets.myeikserver.com`,
            default: '',
        },
        cwd: {
            alias: 'c',
            describe: `Alter the current working directory
                Defaults to the directory where the command is being run.
                This affects where the generated "assets.json" file will be saved.
                Eg. --cwd /path/to/save/to`,
            default: process.cwd(),
        },
        major: {
            alias: 'm',
            describe: `Specify the semver major version field in "assets.json".
                This should be a single integer. 
                Eg. --major 2`,
            default: 1,
        },
        name: {
            alias: 'n',
            describe: `Specify the app name field in "assets.json".
                Eg. --name my-great-app`,
            default: '',
        },
        js: {
            describe:
                `Specify the path on local disk to JavaScript client side assets relative to the current working directory.
                This will be used to populate the "js.input" field of "assets.json"`,
            default: '',
        },
        css: {
            describe:
                `Specify the path on local disk to CSS client side assets relative to the current working directory.
                This will be used to populate the "css.input" field of "assets.json"`,
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
    const { name, major, server, js, css, cwd, debug } = argv;
    const { pathname } = resolvePath('./assets.json', cwd);
    const log = logger(spinner, debug);
    let assetFileExists = false;

    try {
        log.debug(`Checking for existing "assets.json" file in directory (${cwd})`);
        try {
            const st = fs.statSync(pathname);
            if (st.isFile()) {
                assetFileExists = true;
            }
        } catch(err) {
            // noop
        }
        
        if (assetFileExists) {
            throw new Error(`An "assets.json" file already exists in directory. File will not be written`);
        }

        log.debug(`Writing "assets.json" to directory (${cwd})`);
        fs.writeFileSync(
            pathname,
            JSON.stringify(
                {
                    name,
                    major,
                    server,
                    js: { input: js, options: {} },
                    css: { input: css, options: {} },
                },
                null,
                2,
            ),
        );

        log.info(`"assets.json" successfully written to directory`);
        spinner.text = '';
        spinner.stopAndPersist();
    } catch (err) {
        log.warn(err.message);

        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
