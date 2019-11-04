'use strict';

const ora = require('ora');
const Version = require('../classes/version');
const { logger } = require('../utils');

exports.command = 'version <major|minor|patch>';

exports.aliases = ['v'];

exports.describe = `Bumps the version in an assets.json file by the appropriate semver type as given.`;

exports.builder = yargs => {
    yargs.positional('major|minor|patch', {
        describe: `Bump the version field in assets.json
by major (1.0.0 -> 2.0.0), minor (1.0.0 -> 1.1.0) or patch (1.0.0 -> 1.0.1)`,
        type: 'string',
        choices: ['major', 'minor', 'patch'],
        requiresArg: true,
    });

    yargs.options({
        cwd: {
            alias: 'c',
            describe: 'Alter current working directory.',
            default: process.cwd(),
        },
    });
};

exports.handler = async argv => {
    const spinner = ora().start();
    let success = false;

    try {
        success = await new Version({
            logger: logger(spinner),
            cwd: argv.cwd,
            level: argv.major,
        }).run();
    } catch (err) {
        logger.warn(err.message);
    }

    if (success) {
        spinner.succeed('🤘');
    } else {
        spinner.fail('🥺');
        process.exit(1);
    }
};
