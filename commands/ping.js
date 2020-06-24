'use strict';

const ora = require('ora');
const Ping = require('../classes/ping');
const { logger, getDefaults, getCWD } = require('../utils');

exports.command = 'ping [server]';

exports.aliases = [];

exports.describe = `Ping an Eik server to check that it is responding.`;

exports.builder = (yargs) => {
    const cwd = getCWD();
    const defaults = getDefaults(cwd);

    yargs.positional('server', {
        describe: 'Specify location of Eik server to ping.',
        default: defaults.server,
    });

    yargs.options({
        debug: {
            describe: 'Logs additional messages',
            default: false,
            type: 'boolean',
        },
    });

    yargs.example(`eik ping`);
    yargs.example(`eik ping http://assets.myeikserver.com`);
    yargs.example(`eik ping http://assets.myeikserver.com --debug`);
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    const { debug, server } = argv;

    try {
        await new Ping({ logger: logger(spinner, debug), server }).run();
    } catch (err) {
        logger.warn(err.message);
    }

    spinner.text = '';
    spinner.stopAndPersist();
};
