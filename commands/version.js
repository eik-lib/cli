'use strict';

const ora = require('ora');
const semver = require('semver');
const fs = require('fs');
const { resolvePath, readAssetsJson } = require('../utils');
const v = require('../validators');

async function command(subcommands, args) {
    console.log('');
    console.log('✨', 'Asset Pipe Version', '✨');
    console.log('');

    let assets = {};
    const [semverType] = subcommands;
    const { pathname } = resolvePath('./assets.json');

    const inputValidationSpinner = ora('Validating input').start();
    if (v.semverType.validate(semverType).error) {
        inputValidationSpinner.fail(
            `Invalid 'semver' type. Valid types are "major", "minor" and "patch"`
        );
        process.exit();
    }
    inputValidationSpinner.succeed();

    const readAssetsSpinner = ora('Reading assets.json file').start();
    try {
        assets = readAssetsJson();
    } catch (err) {
        readAssetsSpinner.fail(
            'Failed to read assets.json. Does this file exist?'
        );

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    readAssetsSpinner.succeed();

    const versionSpinner = ora('Updating assets.json version field').start();
    try {
        assets.version = semver.inc(assets.version, semverType);
    } catch (err) {
        versionSpinner.fail('Failed to update assets.version');

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    versionSpinner.succeed();

    const writeSpinner = ora('Saving assets.json back to disk').start();
    try {
        fs.writeFileSync(pathname, JSON.stringify(assets, null, 2));
    } catch (err) {
        writeSpinner.fail('Unable to save assets.json file back to disk');

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    writeSpinner.succeed();

    console.log('');
    console.log(
        `✨ Done! assets.json version field now set to ${assets.version} ✨`
    );
    console.log('');
}

module.exports = command;
