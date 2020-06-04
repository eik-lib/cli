'use strict';

const ora = require('ora');
const Alias = require('../classes/alias');
const { logger, Alias: AliasFormatter, getDefaults, getCWD } = require('../utils');

exports.command = 'map-alias <name> <version> <alias>';

exports.aliases = ['ma'];

exports.describe = `Create a semver major alias for an import map as identified by its name and version.
    An import map with the given name and version must already exist on asset server
    Alias should be the semver major part of the import map version.
    Eg. For an import map of version 5.4.3, you should use 5 as the alias`;

exports.builder = (yargs) => {
    const cwd = getCWD();
    const defaults = getDefaults(cwd);

    yargs
        .positional('name', {
            describe:
                `Import map name for import map that is to be aliased`,
            type: 'string',
        })
        .positional('version', {
            describe:
                `Import map version for import map that is to be aliased`,
            type: 'string',
        })
        .positional('alias', {
            describe:
                `Alias for a semver version. Should be the semver major component of version.`,
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

    yargs.example(`eik map-alias my-map 1.0.0 1`);
    yargs.example(`eik map-alias my-map 1.7.3 1`);
    yargs.example(`eik map-alias my-map 6.3.1 6`);
    yargs.example(`eik map-alias my-map 6.3.1 6 --server https://assets.myeikserver.com`);
    yargs.example(`eik map-alias my-map 4.2.2 4 --debug`);
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let success = false;
    const { debug, name, version, server } = argv;
    const log = logger(spinner, debug);
    let data = {};

    try {
        data = await new Alias({
            type: 'map',
            logger: log,
            ...argv,
        }).run();

        data.name = name;
        data.version = version;
        data.files = [];

        const createdOrUpdated = data.update ? 'Updated' : 'Created';
        log.info(`${createdOrUpdated} alias for package "${data.name}". ("${data.version}" => "v${data.alias}")`);
        success = true;
    } catch (err) {
        log.warn(err.message);
    }

    spinner.text = '';
    spinner.stopAndPersist();
    if (success) {
        new AliasFormatter(data).format(server);
    }
};
