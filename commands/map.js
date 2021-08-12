'use strict';

const { join } = require('path');
const fetch = require('node-fetch');
const ora = require('ora');
const PublishMap = require('../classes/publish/map');
const { logger, getDefaults, getCWD } = require('../utils');
const { Artifact } = require('../formatters');

exports.command = 'map <name> <version> <file>';

exports.aliases = ['m'];

exports.describe = `Upload an import map file to the server under a given name and version.
    A name/version combination must be unique and a version must be semver compliant.
    Subsquent published versions must increase. Eg. 1.0.0 1.0.1, 1.1.0, 2.0.0 etc.`;

exports.builder = (yargs) => {
    const cwd = getCWD();
    const defaults = getDefaults(cwd);

    yargs
        .positional('name', {
            describe: 'Import map name.',
            type: 'string',
        })
        .positional('version', {
            describe: 'Import map version.',
            type: 'string',
        })
        .positional('file', {
            describe:
                'Path to import map file on local disk relative to the current working directory.',
            type: 'string',
            normalize: true,
        });

    yargs.options({
        server: {
            alias: 's',
            describe: 'Specify location of asset server.',
            default: defaults.server,
        },
        cwd: {
            alias: 'c',
            describe: 'Alter current working directory.',
            default: defaults.cwd,
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

    yargs.default('token', defaults.token, defaults.token ? '######' : '');

    yargs.example(`eik map my-map 1.0.0 ./import-map.json`);
    yargs.example(`eik map my-map 2.1.0 ./import-map.json --debug`);
    yargs.example(
        `eik map my-map 2.1.1 ./import-map.json --server https://assets.myeikserver.com`,
    );
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    const { debug, server, name, version } = argv;

    try {
        const log = logger(spinner, debug);

        await new PublishMap({ logger: log, ...argv }).run();

        let url = new URL(join('map', name), server);
        let res = await fetch(url);
        const pkgMeta = await res.json();

        url = new URL(join('map', name, version), server);
        res = await fetch(url);

        log.info(`Published import map "${name}" at version "${version}"`);

        spinner.text = '';
        spinner.stopAndPersist();

        const artifact = new Artifact(pkgMeta);
        const versions = new Map(pkgMeta.versions);
        artifact.versions = Array.from(versions.values());
        artifact.format(server);

        process.stdout.write('\n');
    } catch (err) {
        spinner.warn(err.message);
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
