'use strict';

const ora = require('ora');
const fetch = require('node-fetch');
const semver = require('semver');
const { readAssetsJson, sendCommand } = require('../../utils');
const v = require('../../validators');

async function set(type, name, value) {
    console.log('');
    console.log('✨', 'Asset Pipe Import Map Set', '✨');
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

    if (v.uriOrVersionOrAlias.validate(value).error) {
        inputValidationSpinner.fail(
            `Invalid 'value' field specified. Must be a uri, semver version or alias`
        );
        process.exit();
    }
    inputValidationSpinner.succeed();

    const parseValueSpinner = ora('Expanding "value" to absolute URL').start();
    let absoluteUrl = '';
    try {
        if (String(value).startsWith('http://')) {
            parseValueSpinner.text =
                'Expanding "value" to absolute URL ...no expansion needed';
            absoluteUrl = value;
        } else if (semver.valid(value)) {
            const url = new URL(
                `/${organisation}/${type}/${name}/${value}`,
                server
            );
            absoluteUrl = url.href;
            parseValueSpinner.text =
                'Expanding "value" to absolute URL ...semver expansion used';
        } else {
            const url = new URL(
                `/a/${organisation}/${type}/${name}/${value}`,
                server
            );
            absoluteUrl = url.href;
            parseValueSpinner.text =
                'Expanding "value" to absolute URL ...alias expansion used';
        }
    } catch (err) {
        parseValueSpinner.fail('Unable to expand "value" to absolute URL');

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    parseValueSpinner.succeed();

    const verifyAbsoluteUrlSpinner = ora('Verifying expanded URL').start();
    try {
        const res = await fetch(absoluteUrl);
        if (!res.ok || !String(res.status).startsWith('2')) {
            throw new Error(`Address responded with a non 200 status code`);
        }
    } catch (err) {
        verifyAbsoluteUrlSpinner.fail(
            'Unable to verify existence of absolute URL, does the alias, semver range or url provided exist?'
        );

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    verifyAbsoluteUrlSpinner.succeed();

    const sendCommandSpinner = ora(
        'Requesting import map set from asset server'
    ).start();

    try {
        await sendCommand({
            method: 'PUT',
            host: server,
            pathname: `/import-map/${organisation}/${type}/${name}`,
            data: JSON.stringify({ value: absoluteUrl }),
        });
    } catch (err) {
        sendCommandSpinner.fail('Unable to complete map set command');
        console.log('==========');
        console.error(err);
        console.log('==========');
        process.exit();
    }

    sendCommandSpinner.succeed();

    console.log('');
    console.log(`✨ Success ✨`);
    console.log(`:: ${name} -> ${absoluteUrl}`);
    console.log('');
}

module.exports = set;
