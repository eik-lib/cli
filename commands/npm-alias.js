'use strict';

const ora = require('ora');
const Alias = require('../classes/alias');
const { logger, getDefaults, getCWD } = require('../utils');
const { Alias: AliasFormatter } = require('../formatters');

exports.command = 'npm-alias <name> <version> <alias>';

exports.aliases = ['na', 'dep-alias', 'dependency-alias'];

exports.describe = `Create a semver major alias for an NPM package as identified by its name and version.
    An NPM package with the given name and version must already exist on the asset server
    Alias should be the semver major part of the NPM package version.
    Eg. For an NPM package of version 5.4.3, you should use 5 as the alias`;

exports.builder = (yargs) => {
    const cwd = getCWD();
    const defaults = getDefaults(cwd);

    yargs
        .positional('name', {
            describe: 'Name matching NPM package name.',
            type: 'string',
        })
        .positional('version', {
            describe: 'Version matching NPM package version.',
            type: 'string',
        })
        .positional('alias', {
            describe:
                'Alias for a semver version. Must be the semver major component of version.',
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

    yargs.example(`eik npm lit-html 1.0.0 1`);
    yargs.example(`eik npm lit-html 1.3.5 1 --debug`);
    yargs.example(
        `eik npm lit-html 5.3.2 5 --server https://assets.myeikserver.com`,
    );
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let success = false;
    const { debug, server } = argv;
    const log = logger(spinner, debug);
    let data = {};

    try {
        data = await new Alias({
            type: 'npm',
            logger: log,
            ...argv,
        }).run();

        const createdOrUpdated = data.update ? 'Updated' : 'Created';
        log.info(
            `${createdOrUpdated} alias for package "${data.name}". ("${data.version}" => "v${data.alias}")`,
        );
        success = true;
    } catch (err) {
        log.warn(err.message);
    }

    spinner.text = '';
    spinner.stopAndPersist();
    if (success) {
        new AliasFormatter(data).format(server);
    } else {
        process.exit(1);
    }
};
