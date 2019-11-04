'use strict';

const { test } = require('tap');
const { join } = require('path');
const { unlinkSync } = require('fs');
const cli = require('../');
const { mockLogger } = require('./utils');

test('Initializing a new assets.json file', async t => {
    const l = mockLogger();

    const result = await new cli.Init({
        logger: l.logger,
        cwd: join(__dirname, 'tmp')
    }).run();

    const assets = require(join(__dirname, 'tmp', 'assets.json'));

    t.equals(result, true, 'Command should return true');

    t.equals(assets.name, '', 'assets.json "name" field should be empty');
    t.equals(
        assets.version,
        '1.0.0',
        'assets.json "version" field should not be empty'
    );
    t.equals(
        assets.organisation,
        '',
        'assets.json "organisation" field should be empty'
    );
    t.equals(assets.server, '', 'assets.json "server" field should be empty');
    t.equals(
        assets.js.input,
        '',
        'assets.json "js.input" field should be empty'
    );
    t.equals(
        assets.css.input,
        '',
        'assets.json "css.input" field should be empty'
    );

    t.match(
        l.logs.debug,
        'Init command complete',
        'Log output should command completion'
    );

    unlinkSync(join(__dirname, 'tmp', 'assets.json'));
});
