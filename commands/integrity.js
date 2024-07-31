/* eslint-disable prefer-template */
/* eslint-disable no-restricted-properties */
/* eslint-disable one-var */
import { join } from 'path';
import ora from 'ora';
import { helpers } from '@eik/common';
import Integrity from '../classes/integrity.js';
import { logger, getDefaults, getCWD } from '../utils/index.js';
import json from '../utils/json/index.js';

const { configStore } = helpers;

export const command = 'integrity [name] [version]';

export const aliases = ['int'];

export const describe = `Retrieve file integrity information for package name and version defined in eik.json, then populate integrity.json file with this information`;

export const builder = (yargs) => {
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

export const handler = async (argv) => {
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
