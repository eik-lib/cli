'use strict';

const { join } = require('path');
const fetch = require('node-fetch');
const ora = require('ora');
const chalk = require('chalk');
const {
    helpers: { configStore },
} = require('@eik/common');
const PublishPackage = require('../classes/publish/package/index');
const { logger, getDefaults, getCWD } = require('../utils');
const { Artifact } = require('../formatters');

exports.command = 'package';

exports.aliases = ['pkg', 'publish'];

exports.describe = `Publish an app package to an Eik server by a given semver level.
    Bundles and publishes JavaScript and CSS at given local paths creating a new version based off the previous version and the given semver level.
    Specifying semver level is optional and defaults to "patch", specifying "major" locks version to the given semver major.
    If a package has never previously been published, the first version generated will be equal to specified major version or 1.0.0 if no major is specified.
    Local paths to asset files can be defined in an "eik.json" file using "js.input" and "css.input" fields or can be provided directly to the CLI command using the flags --js and --css.
    URLs to import maps can be provided to map "bare" imports found in asset files, to do so either use the field "map" in "eik.json" or the --map CLI flag.`;

exports.builder = (yargs) => {
    const cwd = getCWD();
    const defaults = getDefaults(cwd);

    yargs.options({
        cwd: {
            alias: 'c',
            describe: 'Alter the current working directory.',
            default: defaults.cwd,
            type: 'string',
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
        npm: {
            describe: 'Assigns package to the NPM namespace',
            default: false,
            type: 'boolean',
        },
        token: {
            describe:
                `Provide a jwt token to be used to authenticate with the Eik server.
                Automatically determined if authenticated (via eik login)`,
            type: 'string',
            alias: 't',
        },
    });

    yargs.default('token', defaults.token, defaults.token ? '######' : '');

    yargs.example(`eik package`);
    yargs.example(`eik publish`);
    yargs.example(`eik publish --dry-run`);
    yargs.example(`eik pkg --token ######`);
    yargs.example(`eik pkg --debug`);
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    const { debug, dryRun, cwd, token, npm } = argv;
    const config = configStore.findInDirectory(cwd);
    const {name, server, map, version, out} = config;

    try {
        const options = { 
            logger: logger(spinner, debug),
            name,
            server,
            map: Array.isArray(map) ? map : [map],
            config,
            version,
            cwd,
            token,
            dryRun,
            debug,
            out,
            npm,
        };

        const type = npm ? 'npm' : 'pkg';

        const publish = await new PublishPackage(options).run();

        if (!publish) {
            spinner.warn('Version in eik.json has not changed since last publish, publishing is not necessary');
            process.stdout.write('\n');
            process.exit(0);
        }

        const { files: fls } = publish;

        if (!dryRun) {
            let url = new URL(join(type, name), server);
            let res = await fetch(url);
            const pkgMeta = await res.json();

            url = new URL(join(type, name, version), server);
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

            process.stdout.write(`:: ${chalk.bgYellow.white.bold(npm ? ' NPM ' : ' PACKAGE ')} > ${chalk.green(name)} | ${chalk.bold('dry run')}`);
            process.stdout.write('\n\n');
            process.stdout.write('   files (local temporary):\n');
            for (const file of fls) {
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
