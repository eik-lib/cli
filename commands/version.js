import { execSync } from 'child_process';
import { join } from 'path';
import ora from 'ora';
import VersionPackage from '../classes/version.js';
import { logger, getDefaults } from '../utils/index.js';
import json from '../utils/json/index.js';

export const command = 'version [level]';

export const describe = `Compares local files with files on server and increments "version" field in eik.json if necessary.`;

export const builder = (yargs) => {
    yargs.positional('level', {
        describe: 'Semver level to increment version by',
        default: 'patch',
        type: 'string',
        choices: ['major', 'minor', 'patch'],
    });

    yargs.options({
        dryRun: {
            alias: 'd',
            describe:
                'Terminates the publish early (before upload) and provides information about created bundles for inspection.',
            default: false,
            type: 'boolean',
        },
    });

    yargs.example(`eik version`);
    yargs.example(`eik version minor`);
};

export const handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    const { level, debug, dryRun, cwd, config } = argv;
    // @ts-expect-error
    const { name, version, server, map, out, files } = getDefaults(
        config || cwd,
    );

    try {
        const log = logger(spinner, debug);

        const options = {
            logger: log,
            name,
            server,
            version,
            cwd,
            level,
            map,
            out,
            files,
        };

        const newVersion = await new VersionPackage(options).run();

        if (dryRun) {
            log.info(
                `Dry Run: new version needed, determined new version to be ${newVersion}`,
            );
        } else {
            log.debug(`Writing new version ${newVersion} to eik.json`);
            // @ts-expect-error
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
    }
};
