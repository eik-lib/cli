'use strict';

const { execSync } = require('child_process');
const { promises: fs, constants } = require('fs');
const { join } = require('path');
const ora = require('ora');
const VersionPackage = require('../classes/version');
const { logger, getDefaults, getCWD } = require('../utils');
const json = require('../utils/json');

exports.command = 'version [level]';

exports.aliases = ['v'];

exports.describe = `Compares local files with files on server and increments "version" field in eik.json if necessary.`;

exports.builder = (yargs) => {
    const cwd = getCWD();
    const defaults = getDefaults(cwd);

    yargs.positional('level', {
        describe: 'Semver level to increment version by',
        default: 'patch',
        type: 'string',
        choices: ['major', 'minor', 'patch'],
    });

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

    yargs.example(`eik version`);
    yargs.example(`eik version minor`);
    yargs.example(`eik v`);
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    const { level, debug, dryRun, cwd, token } = argv;
    const { name, version, server, entrypoints, map, out } = getDefaults(cwd);

    try {
        try {
            await fs.access(join(cwd, 'eik.json'), constants.F_OK);
        } catch (err) {
            throw new Error(
                'No eik.json file found in the current working directory. Please run eik init',
            );
        }

        const log = logger(spinner, debug);

        const options = {
            logger: log,
            name,
            server,
            version,
            cwd,
            token,
            dryRun,
            debug,
            level,
            entrypoints,
            map: Array.isArray(map) ? map : [map],
            out,
        };

        const newVersion = await new VersionPackage(options).run();

        if (dryRun) {
            log.info(
                `Dry Run: new version needed, determined new version to be ${newVersion}`,
            );
        } else {
            log.debug(`Writing new version ${newVersion} to eik.json`);
            await json.writeEik({ version: newVersion }, { cwd });

            log.debug(`Committing eik.json to local git repository`);
            try {
                execSync(`git add ${join(cwd, 'eik.json')}`);
                log.debug(`  ==> stage: ${join(cwd, 'eik.json')}`);
            } catch (err) {
                throw new Error(
                    'Failed to stage file "eik.json". Is this directory (or any parent directories) a git repository?',
                );
            }

            try {
                execSync(
                    `git commit -m "build(assets): version eik.json to v${newVersion} [skip ci]"`,
                    {
                        env: {
                            GIT_AUTHOR_NAME: 'Eik Cli',
                            GIT_AUTHOR_EMAIL: 'eik@eik.dev',
                            GIT_COMMITTER_NAME: 'Eik Cli',
                            GIT_COMMITTER_EMAIL: 'eik@eik.dev',
                        },
                        stdio: 'ignore',
                    },
                );
                log.debug(`  ==> commit`);

                log.info(`New version ${newVersion} written back to eik.json`);
            } catch (err) {
                throw new Error('Failed to commit changes to file "eik.json".');
            }
        }

        spinner.text = '';
        spinner.stopAndPersist();
        process.exit();
    } catch (err) {
        spinner.warn(err.message);
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
