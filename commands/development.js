'use strict';

const ora = require('ora');
const { readFileSync } = require('fs');
const Development = require('../classes/development');
const { resolvePath, logger } = require('../utils');

exports.command = 'development';

exports.aliases = ['d', 'dev'];

exports.describe = `Build an apps dependencies based on local assets.json file.`;

exports.builder = yargs => {
    let assets = {};
    try {
        const assetsPath = resolvePath('./assets.json').pathname;
        assets = JSON.parse(readFileSync(assetsPath));
    } catch (err) {
        // noop
    }

    yargs.options({
        name: {
            alias: 'n',
            describe: 'Specify the app name context for the command.',
            default: assets.name,
        },
        watch: {
            alias: 'w',
            describe: 'Watch for file system changes and rebuild.',
            default: false,
            type: 'boolean',
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
        js: {
            describe:
                'Specify the path on local disk to JavaScript client side assets relative to the current working directory.',
            default: assets.js && assets.js.input,
        },
        css: {
            describe:
                'Specify the path on local disk to CSS client side assets relative to the current working directory.',
            default: assets.css && assets.css.input,
        },
    });
};

exports.handler = async argv => {
    const spinner = ora().start('working...');
    let success = false;
    const { debug, watch } = argv;

    try {
        const options = { logger: logger(spinner, debug), ...argv };
        success = await new Development(options).run();
    } catch (err) {
        spinner.warn(err.message);
    }

    if (success) {
        if (watch) {
            spinner.text = 'watching...';

            process
                .on('SIGINT', () => {
                    spinner.text = 'Done!';
                    spinner.stopAndPersist();
                    process.exit();
                })
                .on('SIGTERM', () => {
                    spinner.text = 'Done!';
                    spinner.stopAndPersist();
                    process.exit();
                });
        } else {
            spinner.text = '';
            spinner.stopAndPersist();
        }
    } else {
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
