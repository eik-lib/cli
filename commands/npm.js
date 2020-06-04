'use strict';

const { join } = require('path');
const fetch = require('node-fetch');
const ora = require('ora');
const chalk = require('chalk');
const PublishNPM = require('../classes/publish/npm');
const { logger, Artifact, getDefaults, getCWD } = require('../utils');

exports.command = 'npm <name> [<version>]';

exports.aliases = ['dep', 'dependency'];

exports.describe = `Publish an NPM package to server by given name and optionally version.
    If version is not specified, latest version as indicated by NPM latest dist-tag will be used as version.
    Versions must be semver compliant and version numbers for subsequent published packages must increase.
    One or more import maps may be provided by URL. The URL must serve a JSON import map file which may specify
    one or more mappings between "bare imports" and URLs. When one or more such import maps are given, 
    they will be used to replace any "bare" imports in the NPM package with the URL given in the map.`;

exports.builder = (yargs) => {
    const cwd = getCWD();
    const defaults = getDefaults(cwd);

    yargs
        .positional('name', {
            describe: 'NPM package name.',
            type: 'string',
        })
        .positional('version', {
            describe:
                'Semver NPM package version. If not provided, will default to NPM latest dist-tag.',
            type: 'string',
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
        map: {
            alias: 'm',
            describe:
                'Provide an array of URLs to import maps that should be used when making bundles',
            default: defaults.map,
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
            describe:
                'Provide a jwt token to be used to authenticate with the Eik server.',
            default: '',
            alias: 't',
        },
    });

    yargs.default('token', defaults.token, defaults.token ? '######' : '');
    yargs.array('map');

    yargs.example(`eik npm react`);
    yargs.example(`eik npm react 16.13.1`);
    yargs.example(`eik npm lit-html --server https://assets.myeikserver.com`);
    yargs.example(`eik npm lit-html 1.2.1 --debug`);
    yargs.example(`eik npm @pika/react 16.13.1 --dry-run`);
    yargs.example(`eik npm @pika/react 16.13.1 --token ######`);
    yargs.example(`eik npm react-dom --map https://server.com/map.json`);
    yargs.example(`eik npm @pika/react-dom --map https://server.com/map1.json --map https://server.com/map2.json`);
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    const { debug, server, name, dryRun } = argv;
    try {
        const log = logger(spinner, debug);
        const { version, files } = await new PublishNPM({
            logger: log,
            ...argv,
        }).run();

        if (!dryRun) {
            let url = new URL(join('npm', name), server);
            let res = await fetch(url);
            const pkgMeta = await res.json();

            url = new URL(join('npm', name, version), server);
            res = await fetch(url);
            const pkgVersionMeta = await res.json();

            const artifact = new Artifact(pkgMeta);
            artifact.versions = [pkgVersionMeta];

            spinner.text = '';
            spinner.stopAndPersist();

            artifact.format(server);
            process.stdout.write('\n');
        } else {
            spinner.text = '';
            spinner.stopAndPersist();

            process.stdout.write(
                `:: ${chalk.bgRed.white.bold(' NPM ')} > ${chalk.green(
                    name,
                )} | ${chalk.bold('dry run')}`,
            );
            process.stdout.write('\n\n');
            process.stdout.write('   files (local temporary):\n');
            for (const file of files) {
                process.stdout.write(
                    `   - ${chalk.bold('type')}: ${file.type}\n`,
                );
                process.stdout.write(
                    `     ${chalk.bold('path')}: ${file.pathname}\n\n`,
                );
            }
            process.stdout.write(
                `   ${chalk.bold(
                    'No files were published to remote server',
                )}\n\n`,
            );
        }
    } catch (err) {
        spinner.warn(err.message);
        spinner.text = '';
        spinner.stopAndPersist();
    }
};
