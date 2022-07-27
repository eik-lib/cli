/* eslint-disable prefer-template */
/* eslint-disable no-restricted-properties */
/* eslint-disable one-var */

'use strict';

const { join } = require('path');
const ora = require('ora');
const { configStore, getDefaults } = require('@eik/common-config-loader');
const Integrity = require('../classes/integrity');
const { logger, getCWD } = require('../utils');
const json = require('../utils/json');

exports.command = 'integrity [name] [version]';

exports.aliases = ['int'];

exports.describe = `Retrieve file integrity information for package name and version defined in eik.json, then populate integrity.json file with this information`;

exports.builder = (yargs) => {
    const cwd = getCWD();
    const defaults = getDefaults(cwd);

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

    yargs.example(`eik integrity`);
    yargs.example(`eik integrity --debug`);
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let integrity = false;
    const { debug, cwd } = argv;
    const l = logger(spinner, debug);
    const config = configStore.findInDirectory(cwd);
    const { name, server, version, type, out } = config;

    try {
        integrity = await new Integrity({
            logger: l,
            name,
            version,
            server,
            debug,
            cwd,
            type,
        }).run();

        if (integrity) {
            const filename = join(out, 'integrity.json');
            await json.write(integrity, { cwd, filename });
            spinner.succeed(
                `integrity information for package "${name}" (v${version}) saved to "${filename}"`,
            );
            process.stdout.write('\n');
        }
    } catch (err) {
        spinner.text = '';
        spinner.stopAndPersist();
        l.warn(err.message);
        process.exit(1);
    }
};
