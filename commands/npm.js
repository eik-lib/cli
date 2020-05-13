'use strict';

const { join } = require('path');
const fetch = require('node-fetch');
const homedir = require('os').homedir();
const ora = require('ora');
const { readFileSync } = require('fs');
const chalk = require('chalk');
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
    const { debug, token, server, name, dryRun } = argv;
    let s = server;

    try {
        const meta = await readMetaFile({ cwd: homedir });
        const tokens = new Map(meta.tokens);

        if (!s && tokens.size === 1) {
            s = tokens.keys().next().value;
        }

        const t = token || tokens.get(s) || '';

        const options = { logger: logger(spinner, debug), ...argv, token: t, server: s };
        const { version, files } = await new PublishNPM(options).run();

        if (!dryRun) {
            let url = new URL(join('npm', name), s);
            let res = await fetch(url);
            const pkgMeta = await res.json();

            url = new URL(join('npm', name, version), s);
            res = await fetch(url);
            const pkgVersionMeta = await res.json();

            const artifact = new Artifact(pkgMeta);
            artifact.versions = [ pkgVersionMeta ];

            spinner.text = '';
            spinner.stopAndPersist();

            artifact.format(s);
            process.stdout.write('\n');
        } else {
            spinner.text = '';
            spinner.stopAndPersist();

            process.stdout.write(`:: ${chalk.bgRed.white.bold(' NPM ')} > ${chalk.green(name)} | ${chalk.bold('dry run')}`);
            process.stdout.write('\n\n');
            process.stdout.write('   files (local temporary):\n');
            for (const file of files) {
                process.stdout.write(`   - ${chalk.bold('type')}: ${file.type}\n`);
                process.stdout.write(`     ${chalk.bold('path')}: ${file.pathname}\n\n`);
            }
            process.stdout.write(`   ${chalk.bold('No files were published to remote server')}\n\n`);
        }
    } catch (err) {
        spinner.warn(err.message);
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
