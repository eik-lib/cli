'use strict';

const { test } = require('tap');
const { join } = require('path');
const { unlinkSync, writeFileSync, readFileSync } = require('fs');
const cli = require('../');
const { mockLogger } = require('./utils');

test('Versioning an assets.json file: major', async t => {
    const l = mockLogger();

    writeFileSync(
        join(__dirname, 'tmp', 'assets.json'),
        JSON.stringify({
            server: 'http://localhost:4001',
            name: 'my-test',
            version: '1.0.0',
            organisation: 'my-test-org',
            js: { input: '' },
            css: { input: '' }
        })
    );

    const result = await new cli.Version({
        logger: l.logger,
        cwd: join(__dirname, 'tmp'),
        level: 'major'
    }).run();

    const assets = JSON.parse(
        readFileSync(join(__dirname, 'tmp', 'assets.json'))
    );

    t.equals(result, true, 'Command should return true');
    t.equals(
        assets.version,
        '2.0.0',
        'Command version should have been incremented'
    );
    t.match(
        l.logs.debug,
        'Version command complete',
        'Log output should command completion'
    );

    unlinkSync(join(__dirname, 'tmp', 'assets.json'));
});

test('Versioning an assets.json file: minor', async t => {
    const l = mockLogger();

    writeFileSync(
        join(__dirname, 'tmp', 'assets.json'),
        JSON.stringify({
            server: 'http://localhost:4001',
            name: 'my-test',
            version: '1.0.0',
            organisation: 'my-test-org',
            js: { input: '' },
            css: { input: '' }
        })
    );

    const result = await new cli.Version({
        logger: l.logger,
        cwd: join(__dirname, 'tmp'),
        level: 'minor'
    }).run();

    const assets = JSON.parse(
        readFileSync(join(__dirname, 'tmp', 'assets.json'))
    );

    t.equals(result, true, 'Command should return true');
    t.equals(
        assets.version,
        '1.1.0',
        'Command version should have been incremented'
    );
    t.match(
        l.logs.debug,
        'Version command complete',
        'Log output should command completion'
    );

    unlinkSync(join(__dirname, 'tmp', 'assets.json'));
});

test('Versioning an assets.json file: patch', async t => {
    const l = mockLogger();

    writeFileSync(
        join(__dirname, 'tmp', 'assets.json'),
        JSON.stringify({
            server: 'http://localhost:4001',
            name: 'my-test',
            version: '1.0.0',
            organisation: 'my-test-org',
            js: { input: '' },
            css: { input: '' }
        })
    );

    const result = await new cli.Version({
        logger: l.logger,
        cwd: join(__dirname, 'tmp'),
        level: 'patch'
    }).run();

    const assets = JSON.parse(
        readFileSync(join(__dirname, 'tmp', 'assets.json'))
    );

    t.equals(result, true, 'Command should return true');
    t.equals(
        assets.version,
        '1.0.1',
        'Command version should have been incremented'
    );
    t.match(
        l.logs.debug,
        'Version command complete',
        'Log output should command completion'
    );

    unlinkSync(join(__dirname, 'tmp', 'assets.json'));
});
