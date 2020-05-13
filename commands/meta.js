/* eslint-disable prefer-template */
/* eslint-disable no-restricted-properties */
/* eslint-disable one-var */

'use strict';

const homedir = require('os').homedir();
const { readFileSync } = require('fs');
const ora = require('ora');
const av = require('yargs-parser')(process.argv.slice(2))
const Meta = require('../classes/meta');
const Artifact = require('../utils/artifact');
const { resolvePath, logger, readMetaFile } = require('../utils');

exports.command = 'meta <name>';

exports.aliases = ['show'];

exports.describe = `Retrieve meta information by package, map or npm name`;

exports.builder = (yargs) => {
    const cwd = av.cwd || av.c || process.cwd();

    let assets = {};
    try {
        const assetsPath = resolvePath('./assets.json', cwd).pathname;
        assets = JSON.parse(readFileSync(assetsPath));
    } catch (err) {
        // noop
    }

    yargs.positional('name', {
        describe:
            'Name matching either package or import map name depending on type given',
        type: 'string',
    });

    yargs.options({
        server: {
            alias: 's',
            describe: 'Specify location of asset server.',
            default: assets.server || '',
        },
        debug: {
            describe: 'Logs additional messages',
            default: false,
            type: 'boolean',
        },
        cwd: {
            alias: 'c',
            describe: 'Alter current working directory.',
            default: process.cwd(),
        },
    });
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let meta = false;
    const { debug, server } = argv;
    const l = logger(spinner, debug);
    let s = server;

    try {
        const m = await readMetaFile({ cwd: homedir });
        const tokens = new Map(m.tokens);

        if (!s && tokens.size === 1) {
            s = tokens.keys().next().value;
        }

        meta = await new Meta({
            logger: l,
            ...argv,
            server: s,
        }).run();
    } catch (err) {
        l.warn(err.message);
    }

    if (meta) {
        spinner.text = '';
        spinner.stopAndPersist();
        
        for (const m of Object.values(meta)) {
            const artifact = new Artifact(m);
            artifact.format(s);
            process.stdout.write(`\n`);
        }

        spinner.text = '';
        spinner.stopAndPersist();
    } else {
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
