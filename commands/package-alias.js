'use strict';

const ora = require('ora');
const Alias = require('../classes/alias');
const { logger, getDefaults, getCWD } = require('../utils');
const { Alias: AliasFormatter } = require('../formatters');

exports.command = 'package-alias <name> <version> <alias>';

exports.aliases = ['pkg-alias', 'pa'];

exports.describe = `Create a semver major alias for a package as identified by its name and version.
    A package with the given name and version must already exist on asset server
    Alias should be the semver major part of the package version.
    Eg. For a package of version 5.4.3, you should use 5 as the alias`;

exports.builder = (yargs) => {
    const cwd = getCWD();
    const defaults = getDefaults(cwd);

    yargs
        .positional('name', {
            describe:
                'Name matching existing name for a package on Eik server',
            type: 'string',
        })
        .positional('version', {
            describe:
                'Version matching existing version for a package on Eik server',
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
            describe: 'Specify location of Eik asset server.',
            default: defaults.server,
        },
        cwd: {
            alias: 'c',
            describe: 'Alter the current working directory.',
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

    yargs.example(`eik package-alias my-app 1.0.0 1`);
    yargs.example(`eik package-alias my-app 1.7.3 1`);
    yargs.example(`eik package-alias my-app 6.3.1 6`);
    yargs.example(`eik package-alias my-app 6.3.1 6 --server https://assets.myeikserver.com`);
    yargs.example(`eik package-alias my-app 4.2.2 4 --debug`);
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let success = false;
    const { debug, server } = argv;
    const log = logger(spinner, debug);
    let af;

    try {
        const data = await new Alias({
            type: 'pkg',
            logger: log,
            ...argv,
        }).run();

        af = new AliasFormatter(data);

        const createdOrUpdated = data.update ? 'Updated' : 'Created';
        log.info(`${createdOrUpdated} alias for package "${data.name}". ("${data.version}" => "v${data.alias}")`);
        success = true;
    } catch (err) {
        log.warn(err.message);
    }

    spinner.text = '';
    spinner.stopAndPersist();
    if (success) {
        af.format(server);
    } else {
        process.exit(1);
    }
};
