'use strict';

const { join } = require('path');
const fetch = require('node-fetch');
const homedir = require('os').homedir();
const ora = require('ora');
const { readFileSync } = require('fs');
const av = require('yargs-parser')(process.argv.slice(2))
const PublishNPM = require('../classes/publish/npm');
const { resolvePath, logger, readMetaFile, Artifact } = require('../utils');

exports.command = 'npm <name> [<version>]';

exports.aliases = ['dep', 'dependency'];

exports.describe = `Publish an NPM package to server by given name and version.`;

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
            describe: 'NPM package name.',
            type: 'string',
        })
        .positional('version', {
            describe: 'Semver NPM package version.',
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
        map: {
            alias: 'm',
            describe:
                'Provide an array of URLs to import maps that should be used when making bundles',
            default: assets['import-map'] || [],
        },
        dryRun: {
            alias: 'd',
            describe:
                'Terminates the publish early (before upload) and provides information about created bundles for inspection.',
            default: false,
            type: 'boolean',
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
    let success = false;
    let artifact;
    const { debug, token, server, name, dryRun } = argv;

    try {
        const meta = await readMetaFile({ cwd: homedir });
        const tokens = new Map(meta.tokens);
        const t = token || tokens.get(server) || '';

        const options = { logger: logger(spinner, debug), ...argv, token: t };
        const version = await new PublishNPM(options).run();

        if (!dryRun) {
            let url = new URL(join('npm', name), server);
            let res = await fetch(url);
            const pkgMeta = await res.json();

            url = new URL(join('npm', name, version), server);
            res = await fetch(url);
            const pkgVersionMeta = await res.json();

            artifact = new Artifact(pkgMeta);
            artifact.versions = [ pkgVersionMeta ];
        }

        if (version || dryRun) {
            success = true;
        } else {
            success = false;
        }
    } catch (err) {
        spinner.warn(err.message);
    }

    if (success) {
        spinner.text = '';
        spinner.stopAndPersist();
        if (!dryRun) {
            artifact.format(server);
            process.stdout.write('\n');
        }
    } else {
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
