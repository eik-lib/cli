'use strict';

const { join } = require('path');
const fetch = require('node-fetch');
const ora = require('ora');
const chalk = require('chalk');
const PublishPackage = require('../classes/publish/package/index');
const { logger, Artifact, getDefaults, getCWD } = require('../utils');

exports.command = 'package [level]';

exports.aliases = ['pkg'];

exports.describe = `Publish an app package to an Eik server by a given semver level.
    Bundles and publishes JavaScript and CSS at given local paths creating a new version based off the previous version and the given semver level.
    Specifying semver level is optional and defaults to "patch", specifying "major" locks version to the given semver major.
    If a package has never previously been published, the first version generated will be equal to specified major version or 1.0.0 if no major is specified.
    Local paths to asset files can be defined in an "assets.json" file using "js.input" and "css.input" fields or can be provided directly to the CLI command using the flags --js and --css.
    URLs to import maps can be provided to map "bare" imports found in asset files, to do so either use the field "map" in "assets.json" or the --map CLI flag.`;

exports.builder = (yargs) => {
    const cwd = getCWD();
    const defaults = getDefaults(cwd);

    yargs.positional('level', {
        describe:
            'Specify the app semver level to use when updating the package.',
        type: 'string',
        choices: ['major', 'minor', 'patch'],
        default: 'patch',
    });

    yargs.options({
        server: {
            alias: 's',
            describe: `Specify location of Eik asset server.
                When authenticated (using "eik login") with a single Eik asset server, this can be automatically determined.
                Otherwise, it must be provided as a CLI flag or in an "assets.json" file's "server" field`,
            type: 'string',
            default: defaults.server,
        },
        cwd: {
            alias: 'c',
            describe: 'Alter the current working directory.',
            default: defaults.cwd,
            type: 'string',
        },
        map: {
            alias: 'm',
            describe:
                `Provide one or more URLs to import maps that should be used to map "bare" imports when making bundles.
                Taken from the "assets.json" file's "map" field if not provided by CLI flag.
                Flag can be supplied multiple times, once for each import map URL
                Eg. --map http://my-map.com --map http://my-other-map.com`,
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
        js: {
            describe:
                `Specify the path on local disk to JavaScript client side assets relative to the current working directory.
                Taken from "assets.json" file's "js.input" field if not provided by CLI flag.`,
            default: defaults.js,
            type: 'string',
        },
        css: {
            describe:
                `Specify the path on local disk to CSS client side assets relative to the current working directory.
                Taken from "assets.json" file's "css.input" field if not provided by CLI flag.`,
            default: defaults.css,
            type: 'string',
        },
        name: {
            describe: `Specify the app name.
                Taken from "assets.json" file's "name" field if not provided by CLI flag.`,
            default: defaults.name,
            type: 'string',
        },
        major: {
            describe: `Major semver version to lock updates to. 
                Taken from "assets.json" file's "major" field if not provided by CLI flag.`,
            default: defaults.major,
            type: 'number',
        },
        token: {
            describe:
                `Provide a jwt token to be used to authenticate with the Eik server.
                Automatically determined if authenticated (via eik login)`,
            type: 'string',
            alias: 't',
        },
    });

    yargs.array('map');
    yargs.default('token', defaults.token, defaults.token ? '######' : '');

    yargs.example(`eik package`);
    yargs.example(`eik package patch`);
    yargs.example(`eik package minor --major 1`);
    yargs.example(`eik package patch --major 1 --js ./assets/client.js --css ./assets/styles.css`);
    yargs.example(`eik package patch --name my-app`);
    yargs.example(`eik pkg patch --name my-app`);
    yargs.example(`eik pkg --name my-app --server https://assets.myeikserver.com`);
    yargs.example(`eik pkg --dry-run`);
    yargs.example(`eik pkg --token ######`);
    yargs.example(`eik pkg --map https://server/my-map1.json`);
    yargs.example(`eik pkg --map https://server/my-map1.json --map https://server/my-map2.json`);
    yargs.example(`eik pkg --debug`);
    yargs.example(`eik pkg -s https://assets.myeikserver.com -t ###### --name my-app --js ./assets/client.js --css ./assets/styles.css`);
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    const { debug, name, dryRun, server } = argv;

    try {
        const options = { 
            logger: logger(spinner, debug), 
            ...argv,
        };
        const { version, files } = await new PublishPackage(options).run();

        if (!dryRun) {
            let url = new URL(join('pkg', name), server);
            let res = await fetch(url);
            const pkgMeta = await res.json();

            url = new URL(join('pkg', name, version), server);
            res = await fetch(url);
            const pkgVersionMeta = await res.json();

            const artifact = new Artifact(pkgMeta);
            artifact.versions = [ pkgVersionMeta ];

            spinner.text = '';
            spinner.stopAndPersist();

            artifact.format(server);
            process.stdout.write('\n');
        } else {
            spinner.text = '';
            spinner.stopAndPersist();

            process.stdout.write(`:: ${chalk.bgYellow.white.bold(' PACKAGE ')} > ${chalk.green(name)} | ${chalk.bold('dry run')}`);
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
    }
};
