/* eslint-disable no-nested-ternary */
const ora = require('ora');
const { configStore, getDefaults } = require('@eik/common-config-loader');
const { getCWD, logger } = require('../utils');

const Alias = require('../classes/alias');
const { Alias: AliasFormatter } = require('../formatters');

exports.command = 'alias <name> <version> <alias>';

exports.aliases = [
    'ma',
    'pa',
    'pkg-alias',
    'na',
    'dep-alias',
    'dependency-alias',
];

exports.describe = `Create a semver major alias for a package or an import map as identified by its name and version.
    A package or import map with the given name and version must already exist on the Eik server
    Alias should be the semver major part of the import map version.
    Eg. For a package or import map of version 5.4.3, you should use 5 as the alias`;

exports.builder = (yargs) => {
    const cwd = getCWD();
    const defaults = getDefaults(cwd);

    yargs
        .positional('name', {
            describe: `Name of package or map that is to be aliased`,
            type: 'string',
        })
        .positional('version', {
            describe: `Version for package or map that is to be aliased`,
            type: 'string',
        })
        .positional('alias', {
            describe: `Alias for a semver version. Should be the semver major component of version.`,
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

    yargs.example(`eik alias my-app 1.6.2 1`);
    yargs.example(`eik alias my-map 1.0.1 1`);
    yargs.example(`eik alias lodash 4.17.19 4`);
    yargs.example(
        `eik alias my-map 6.3.1 6 --server https://assets.myeikserver.com`,
    );
    yargs.example(`eik alias my-map 4.2.2 4 --debug`);
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let success = false;
    const { cwd, type: typeFromArgs, debug } = argv;
    const config = configStore.findInDirectory(cwd);
    const { server, type } = config;

    const typeOverride = typeFromArgs || type;
    const log = logger(spinner, debug);

    const isPackage = ['package', 'npm'].includes(typeOverride);

    try {
        const data = await new Alias({
            type:
                typeOverride === 'package'
                    ? 'pkg'
                    : typeOverride === 'npm'
                    ? 'npm'
                    : typeOverride === 'map'
                    ? 'map'
                    : 'pkg',
            logger: log,
            ...argv,
        }).run();

        const createdOrUpdated = data.update ? 'Updated' : 'Created';
        log.info(
            `${createdOrUpdated} alias for ${isPackage ? 'package' : 'map'} "${
                data.name
            }". ("${data.version}" => "v${data.alias}")`,
        );
        success = true;

        spinner.text = '';
        spinner.stopAndPersist();
        if (success) {
            new AliasFormatter(data).format(server);
        } else {
            process.exit(1);
        }
    } catch (err) {
        spinner.warn(err.message);
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
