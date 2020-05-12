'use strict';

const fs = require('fs');
const ora = require('ora');
const { logger, resolvePath } = require('../utils');

exports.command = 'init';

exports.aliases = ['i'];

exports.describe = `Create a new assets.json file in the current working directory`;

exports.builder = (yargs) => {
    yargs.example('eik init');
    yargs.example('eik init --cwd /path/to/dir');
    yargs.example('eik init --server https://assets.myserver.com --major 2 --name my-app --js ./scripts.js --css ./styles.css');
    yargs.example('eik init --debug');

    yargs.options({
        server: {
            alias: 's',
            describe: 'Specify location of asset server.',
            default: '',
        },
        cwd: {
            alias: 'c',
            describe: 'Alter current working directory.',
            default: process.cwd(),
        },
        major: {
            alias: 'm',
            describe: 'Specify the semver major version for the package.',
            default: 1,
        },
        name: {
            alias: 'n',
            describe: 'Specify the app name context for the command.',
            default: '',
        },
        js: {
            describe:
                'Specify the path on local disk to JavaScript client side assets relative to the current working directory.',
            default: '',
        },
        css: {
            describe:
                'Specify the path on local disk to CSS client side assets relative to the current working directory.',
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
