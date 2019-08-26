'use strict';

const ora = require('ora');
const { readAssetsJson, sendCommand } = require('../utils');
const v = require('../validators');

async function command(subcommands, args) {
    console.log('');
    console.log('✨', 'Asset Pipe Alias', '✨');
    console.log('');

    const [type, name, alias, version] = subcommands;

    let server = '';
    let organisation = '';

    const loadAssetsFileSpinner = ora('Loading assets.json').start();
    try {
        ({ server, organisation } = readAssetsJson());
    } catch (err) {
        loadAssetsFileSpinner.fail(
            'Unable to load assets.json. Run "asset-pipe init" to generate'
        );

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    loadAssetsFileSpinner.succeed();

    const inputValidationSpinner = ora('Validating input').start();

    if (v.version.validate(version).error) {
        inputValidationSpinner.fail(`Invalid 'semver' range given`);
        process.exit();
    }

    if (v.organisation.validate(organisation).error) {
        inputValidationSpinner.fail(
            `Invalid 'organisation' field specified in assets.json`
        );
        process.exit();
    }

    if (v.alias.validate(alias).error) {
        inputValidationSpinner.fail(`Invalid 'alias' name given`);
        process.exit();
    }

    if (v.server.validate(server).error) {
        inputValidationSpinner.fail(
            `Invalid 'server' field specified in assets.json`
        );
        process.exit();
    }

    if (v.type.validate(type).error) {
        inputValidationSpinner.fail(`Invalid 'type' specified`);
        process.exit();
    }

    if (v.name.validate(name).error) {
        inputValidationSpinner.fail(`Invalid 'name' specified`);
        process.exit();
    }

    inputValidationSpinner.succeed();

    const sendCommandSpinner = ora(
        'Requesting alias creation from asset server'
    ).start();
    try {
        await sendCommand({
            host: server,
            method: 'PUT',
            pathname: `/a/${organisation}/${type}/${name}/${alias}`,
            data: { version },
        });
    } catch (err) {
        sendCommandSpinner.fail('Unable to complete alias command');

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    sendCommandSpinner.succeed();

    console.log('');
    console.log('✨ Done! ✨');
    console.log('');
}

module.exports = command;
