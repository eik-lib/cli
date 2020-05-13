'use strict';

const homedir = require('os').homedir();
const ora = require('ora');
const { readFileSync } = require('fs');
const av = require('yargs-parser')(process.argv.slice(2))
const Alias = require('../classes/alias');
const { resolvePath, logger, readMetaFile, Alias: AliasFormatter } = require('../utils');

exports.command = 'npm-alias <name> <version> <alias>';

exports.aliases = ['na', 'dep-alias', 'dependency-alias'];

exports.describe = `Create a semver major alias for an NPM package as identified by its name and version.
    An NPM package with the given name and version must already exist on the asset server
    Alias should be the semver major part of the NPM package version.
    Eg. For an NPM package of version 5.4.3, you should use 5 as the alias`;

exports.builder = (yargs) => {
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
            describe:
                'Name matching NPM package name.',
            type: 'string',
        })
        .positional('version', {
            describe:
                'Version matching NPM package version.',
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
            default: assets.server || '',
        },
        cwd: {
            alias: 'c',
            describe: 'Alter current working directory.',
            default: process.cwd(),
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

    yargs.example(`eik npm lit-html 1.0.0 1`);
    yargs.example(`eik npm lit-html 1.3.5 1 --debug`);
    yargs.example(`eik npm lit-html 5.3.2 5 --server https://assets.myeikserver.com`);
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let success = false;
    const { debug, token, server } = argv;
    const log = logger(spinner, debug);
    let data = {};
    let s = server;

    try {
        const meta = await readMetaFile({ cwd: homedir });
        const tokens = new Map(meta.tokens);

        // fallback to ~/.eikrc server if logged in to a single server
        if (!s && tokens.size === 1) {
            s = tokens.keys().next().value;
        }

        const t = token || tokens.get(s) || '';

        data = await new Alias({
            type: 'npm',
            logger: log,
            ...argv,
            token: t,
            server: s,
        }).run();

        const createdOrUpdated = data.update ? 'Updated' : 'Created';
        log.info(`${createdOrUpdated} alias for package "${data.name}". ("${data.version}" => "v${data.alias}")`);
        success = true;
    } catch (err) {
        log.warn(err.message);
    }

    if (success) {
        spinner.text = '';
        spinner.stopAndPersist();

        new AliasFormatter(data).format(s);
    } else {
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
