/* eslint-disable prefer-template */
/* eslint-disable no-restricted-properties */
/* eslint-disable one-var */

'use strict';

const { join } = require('path');
const ora = require('ora');
const Integrity = require('../classes/integrity');
const { logger, getDefaults, getCWD } = require('../utils');
const json = require('../utils/json');

exports.command = 'integrity [name] [version]';

exports.aliases = ['int'];

exports.describe = `Retrieve file integrity information for package name and version defined in eik.json, then populate integrity.json file with this information`;

exports.builder = (yargs) => {
    const cwd = getCWD();
    const defaults = getDefaults(cwd);

    yargs.positional('name', {
        describe: 'Name of package. Defaults to value defined in eik.json',
        type: 'string',
        default: defaults.name,
    });

    yargs.positional('version', {
        describe: 'Semver version of package. Defaults to value defined in eik.json',
        type: 'string',
        default: defaults.version,
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
        out: {
            alias: 'o',
            describe: 'Eik directory',
            default: defaults.out,
        },
        npm: {
            describe: 'Use NPM namespace',
            default: false,
            type: 'boolean',
        },
    });

    yargs.example(`eik integrity`);
    yargs.example(`eik integrity my-package 1.0.0`);
    yargs.example(`eik integrity --debug`);
    yargs.example(`eik integrity --server https://assets.myeikserver.com`);
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let integrity = false;
    const { debug, server, cwd, name, version, out, npm } = argv;
    const l = logger(spinner, debug);

    try {
        integrity = await new Integrity({ 
            logger: l,
            name,
            version,
            server,
            debug,
            cwd,
            npm,
        }).run();

        if (integrity) {
            const filename = join(out, 'integrity.json');
            await json.write(integrity, { cwd, filename });
            spinner.succeed(`integrity information for package "${name}" (v${version}) saved to "${filename}"`);
            process.stdout.write('\n');
        }
    } catch (err) {
        spinner.text = '';
        spinner.stopAndPersist();
        l.warn(err.message);
        process.exit(1);
    }
};
