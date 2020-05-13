'use strict';

const homedir = require('os').homedir();
const ora = require('ora');
const { readFileSync } = require('fs');
const av = require('yargs-parser')(process.argv.slice(2))
const Ping = require('../classes/ping');
const { resolvePath, logger, readMetaFile } = require('../utils');

exports.command = 'ping';

exports.aliases = [];

exports.describe = `Ping an Eik server`;

exports.builder = (yargs) => {
    const cwd = av.cwd || av.c || process.cwd();

    let assets = {};
    try {
        const assetsPath = resolvePath('./assets.json', cwd).pathname;
        assets = JSON.parse(readFileSync(assetsPath));
    } catch (err) {
        // noop
    }

    yargs.options({
        server: {
            alias: 's',
            describe: 'Specify location of eik server.',
            default: assets.server || '',
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
    let success = false;
    const { debug, server } = argv;
    let s = server;

    const meta = await readMetaFile({ cwd: homedir });
    const tokens = new Map(meta.tokens);

    if (!s && tokens.size === 1) {
        s = tokens.keys().next().value;
    }

    try {
        success = await new Ping({
            logger: logger(spinner, debug),
            server: s,
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
