'use strict';

const { join } = require('path');
const fetch = require('node-fetch');
const homedir = require('os').homedir();
const ora = require('ora');
const { readFileSync } = require('fs');
const av = require('yargs-parser')(process.argv.slice(2))
const PublishMap = require('../classes/publish/map');
const { resolvePath, logger, readMetaFile, Artifact } = require('../utils');

exports.command = 'map <name> <version> <file>';

exports.aliases = ['m'];

exports.describe = `Upload an import map file to the server under a given name and version.`;

exports.builder = yargs => {
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
            describe: 'Provide a jwt token to be used to authenticate with the Eik server.',
            default: '',
            alias: 't',
        },
    });
};

exports.handler = async argv => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    const { debug, token, server, name, version } = argv;
    let s = server;

    try {
        const meta = await readMetaFile({ cwd: homedir });
        const tokens = new Map(meta.tokens);

        // fallback to ~/.eikrc server if logged in to a single server
        if (!s && tokens.size === 1) {
            s = tokens.keys().next().value;
        }

        const t = token || tokens.get(s) || '';
        const log = logger(spinner, debug);

        await new PublishMap({
            logger: log,
            ...argv,
            token: t,
            server: s,
        }).run();

        let url = new URL(join('map', name), s);
        let res = await fetch(url);
        const pkgMeta = await res.json();

        url = new URL(join('map', name, version), s);
        res = await fetch(url);

        log.info(`Published import map "${name}" at version "${version}"`);
        
        spinner.text = '';
        spinner.stopAndPersist();
        
        const artifact = new Artifact(pkgMeta);
        const versions = new Map(pkgMeta.versions);
        artifact.versions = Array.from(versions.values());
        artifact.format(s);

        process.stdout.write('\n');
    } catch (err) {
        spinner.warn(err.message);
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
