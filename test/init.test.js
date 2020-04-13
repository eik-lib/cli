'use strict';

const { test } = require('tap');
const { join } = require('path');
const { unlinkSync, readFileSync } = require('fs');
const cli = require('..');
const { mockLogger } = require('./utils');

test('Initializing a new assets.json file', async t => {
    const l = mockLogger();

    const result = await new cli.Init({
        logger: l.logger,
        cwd: join(__dirname, 'tmp'),
        debug: true,
    }).run();

    const assets = JSON.parse(
        readFileSync(join(__dirname, 'tmp', 'assets.json')),
    );

    t.equals(result, true, 'Command should return true');
    t.equals(assets.name, '', 'assets.json "name" field should be empty');
    t.equals(assets.major, '', 'assets.json "major" field should be empty');
    t.equals(
        assets.organisation,
        '',
        'assets.json "organisation" field should be empty',
    );
    t.equals(assets.server, '', 'assets.json "server" field should be empty');
    t.equals(
        assets.js.input,
        '',
        'assets.json "js.input" field should be empty',
    );
    t.equals(
        assets.css.input,
        '',
        'assets.json "css.input" field should be empty',
    );

    t.match(
        l.logs.info,
        'Created "assets.json" file in the current working directory',
        'Log output should command completion',
    );

    unlinkSync(join(__dirname, 'tmp', 'assets.json'));
});

test('Initializing a new assets.json file passing custom values', async t => {
    const l = mockLogger();

    const result = await new cli.Init({
        logger: l.logger,
        cwd: join(__dirname, 'tmp'),
        org: 'custom-org',
        name: 'custom-name',
        major: '1',
        server: 'http://localhost:4001',
        js: './assets/client.js',
        css: './assets/styles.css',
        debug: true,
    }).run();

    const assets = JSON.parse(
        readFileSync(join(__dirname, 'tmp', 'assets.json')),
    );

    t.equals(result, true, 'Command should return true');

    t.equals(
        assets.name,
        'custom-name',
        'assets.json "name" field should not be empty',
    );
    t.equals(
        assets.major,
        '1',
        'assets.json "major" field should not be empty',
    );
    t.equals(
        assets.organisation,
        'custom-org',
        'assets.json "organisation" field should not be empty',
    );
    t.equals(
        assets.server,
        'http://localhost:4001',
        'assets.json "server" field should not be empty',
    );
    t.equals(
        assets.js.input,
        './assets/client.js',
        'assets.json "js.input" field should not be empty',
    );
    t.equals(
        assets.css.input,
        './assets/styles.css',
        'assets.json "css.input" field should not be empty',
    );

    t.match(
        l.logs.info,
        'Created "assets.json" file in the current working directory',
        'Log output should command completion',
    );

    unlinkSync(join(__dirname, 'tmp', 'assets.json'));
});
