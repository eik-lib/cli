/* eslint-disable prefer-template */
/* eslint-disable no-restricted-properties */
/* eslint-disable one-var */

'use strict';

const ora = require('ora');
const Meta = require('../classes/meta');
const { Artifact } = require('../formatters');
const { logger, getDefaults, getCWD } = require('../utils');

exports.command = 'meta <name>';

exports.aliases = ['show'];

exports.describe = `Retrieve meta information by package, map or npm name
    If a given name exists in several types (package and map for example), results will be returned and displayed from all matching types`;

exports.builder = (yargs) => {
    const cwd = getCWD();
    const defaults = getDefaults(cwd);

    yargs.positional('name', {
        describe:
            'Name matching one or more of package, npm or import map name',
        type: 'string',
    });

    yargs.options({
        server: {
            alias: 's',
            describe: 'Specify location of asset server.',
            default: defaults.server,
        },
        debug: {
            describe: 'Logs additional messages',
            default: false,
            type: 'boolean',
        },
        cwd: {
            alias: 'c',
            describe: 'Alter current working directory.',
            default: defaults.cwd,
        },
    });

    yargs.example(`eik meta lit-html`);
    yargs.example(`eik meta my-map --debug`);
    yargs.example(`eik meta my-app --server https://assets.myeikserver.com`);
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let meta = false;
    const { debug, server } = argv;
    const l = logger(spinner, debug);

    try {
        meta = await new Meta({ logger: l, ...argv }).run();
        spinner.text = '';
        spinner.stopAndPersist();
    } catch (err) {
        spinner.text = '';
        spinner.stopAndPersist();
        l.warn(err.message);
        process.exit(1);
    }

    if (meta) {
        for (const m of Object.values(meta)) {
            const artifact = new Artifact(m);
            artifact.format(server);
            process.stdout.write(`\n`);
        }
    }
};
