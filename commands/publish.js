'use strict';

const { join } = require('path');
const fetch = require('node-fetch');
const ora = require('ora');
const chalk = require('chalk');
const {
    helpers: { configStore },
} = require('@eik/common');
const PublishPackage = require('../classes/publish/package/index');
const {
    logger,
    getDefaults,
    getCWD,
    typeSlug,
    typeTitle,
} = require('../utils');
const { Artifact } = require('../formatters');

exports.command = 'publish';

exports.aliases = ['pkg', 'package', 'pub'];

exports.describe = `Publish an app package to an Eik server. Reads configuration from eik.json or package.json files. See https://eik.dev for more details.`;

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
        token: {
            describe: `Provide a jwt token to be used to authenticate with the Eik server.
                Automatically determined if authenticated (via eik login)`,
            type: 'string',
            alias: 't',
        },
    });

    yargs.default('token', defaults.token, defaults.token ? '######' : '');

    yargs.example(`eik publish`);
    yargs.example(`eik package`);
    yargs.example(`eik pub --dry-run`);
    yargs.example(`eik pkg --token ######`);
    yargs.example(`eik pkg --debug`);
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    const { debug, dryRun, cwd, token } = argv;
    const config = configStore.findInDirectory(cwd);
    const { name, server, version, type, map, out, files } = config;

    if (type === 'map') {
        spinner.warn(
            '"type" is set to "map", which is not supported by the publish command. Please use the "eik map" command instead',
        );
        process.stdout.write('\n');
        process.exit(0);
    }

    try {
        const options = {
            logger: logger(spinner, debug),
            cwd,
            token,
            dryRun,
            debug,
            name,
            server,
            version,
            type,
            map,
            out,
            files,
        };

        const publish = await new PublishPackage(options).run();

        if (!publish) {
            spinner.warn(
                'Version in eik.json has not changed since last publish, publishing is not necessary',
            );
            process.stdout.write('\n');
            process.exit(0);
        }

        const { files: fls } = publish;

        if (!dryRun) {
            let url = new URL(join(typeSlug(type), name), server);
            let res = await fetch(url);
            const pkgMeta = await res.json();

            url = new URL(join(typeSlug(type), name, version), server);
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
                `:: ${chalk.bgYellow.white.bold(
                    typeTitle(type),
                )} > ${chalk.green(name)} | ${chalk.bold('dry run')}`,
            );
            process.stdout.write('\n\n');
            process.stdout.write('   files (local temporary):\n');
            for (const file of fls) {
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
        process.exit(1);
    }
};
