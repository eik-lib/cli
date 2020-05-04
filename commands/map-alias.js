'use strict';

const homedir = require('os').homedir();
const ora = require('ora');
const { readFileSync } = require('fs');
const av = require('yargs-parser')(process.argv.slice(2))
const Alias = require('../classes/alias');
const { resolvePath, logger, readMetaFile } = require('../utils');

exports.command = 'map-alias <name> <version> <alias>';

exports.aliases = ['ma'];

exports.describe = `Create a semver major alias for an import map as identified by its name and version.`;

exports.builder = (yargs) => {
    const cwd = av.cwd || av.c || process.cwd();

    let assets = {};
    try {
        const assetsPath = resolvePath('./assets.json', cwd).pathname;
        assets = JSON.parse(readFileSync(assetsPath));
    } catch (err) {
        // noop
    }

    yargs
        .positional('name', {
            describe:
                'Name matching either package or import map name depending on type given',
            type: 'string',
        })
        .positional('version', {
            describe:
                'Version matching either package or import map version depending on type given',
            type: 'string',
        })
        .positional('alias', {
            describe:
                'Alias for a semver version. Must be the semver major component of version. Eg. 1.0.0 should be given as 1',
            type: 'string',
        });

    yargs.options({
        server: {
            alias: 's',
            describe: 'Specify location of asset server.',
            default: assets.server || '',
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
        token: {
            describe:
                'Provide a jwt token to be used to authenticate with the Eik server.',
            default: '',
            alias: 't',
        },
    });
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let success = false;
    const { debug, token, server } = argv;

    try {
        const meta = await readMetaFile({ cwd: homedir });
        const tokens = new Map(meta.tokens);
        const t = token || tokens.get(server) || '';

        success = await new Alias({
            type: 'map',
            logger: logger(spinner, debug),
            ...argv,
            token: t,
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
