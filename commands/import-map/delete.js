'use strict';

const ora = require('ora');
const { readAssetsJson, sendCommand } = require('../../utils');
const v = require('../../validators');

async function del(type, name) {
    console.log('');
    console.log('✨', 'Asset Pipe Import Map Delete', '✨');
    console.log('');

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
    if (v.type.validate(type).error) {
        inputValidationSpinner.fail(`Invalid 'type' field specified`);
        process.exit();
    }

    if (v.name.validate(name).error) {
        inputValidationSpinner.fail(`Invalid 'name' field specified`);
        process.exit();
    }

    if (v.organisation.validate(organisation).error) {
        inputValidationSpinner.fail(
            `Invalid 'organisation' field specified in assets.json file`
        );
        process.exit();
    }

    if (v.server.validate(server).error) {
        inputValidationSpinner.fail(
            `Invalid 'server' field specified in assets.json file`
        );

        process.exit();
    }
    inputValidationSpinner.succeed();

    const sendCommandSpinner = ora(
        'Requesting import map delete from asset server'
    ).start();

    try {
        await sendCommand({
            method: 'DELETE',
            host: server,
            pathname: `/import-map/${organisation}/${type}/${name}`,
        });
    } catch (err) {
        sendCommandSpinner.fail('Unable to complete map delete command');
        console.log('==========');
        console.error(err);
        console.log('==========');
        process.exit();
    }

    sendCommandSpinner.succeed();

    console.log('');
    console.log(`✨ Success ✨`);
    console.log(`:: removed ${name}`);
    console.log('');
}

module.exports = del;
