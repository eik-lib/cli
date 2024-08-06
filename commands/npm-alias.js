// @deprecated in favor of `alias` command

import ora from 'ora';
import Alias from '../classes/alias.js';
import { logger, getDefaults } from '../utils/index.js';
import { Alias as AliasFormatter } from '../formatters/index.js';

export const command = 'npm-alias <name> <version> <alias>';

export const aliases = ['na', 'dep-alias', 'dependency-alias'];

export const describe = `DEPRECATED: This command has been replaced by the alias command and will be removed in a future version. Create a semver major alias for an NPM package as identified by its name and version. An NPM package with the given name and version must already exist on the asset server. Alias should be the semver major part of the NPM package version. Eg. For an NPM package of version 5.4.3, you should use 5 as the alias`;

export const builder = (yargs) => {
    const defaults = getDefaults(yargs.argv.config || yargs.argv.cwd);

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
            // @ts-expect-error
            default: defaults.server,
        },
        token: {
            describe:
                'Provide a jwt token to be used to authenticate with the Eik server.',
            default: '',
            alias: 't',
        },
    });

    // @ts-expect-error
    yargs.default('token', defaults.token, defaults.token ? '######' : '');

    yargs.example(`eik npm lit-html 1.0.0 1`);
    yargs.example(`eik npm lit-html 1.3.5 1 --debug`);
    yargs.example(
        `eik npm lit-html 5.3.2 5 --server https://assets.myeikserver.com`,
    );
};

export const handler = async (argv) => {
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

export const deprecated =
    '"npm-alias" will be removed in a future version. Please use "alias" instead';
