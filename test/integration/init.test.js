'use strict';

const fs = require('fs').promises;
const os = require('os');
const { test } = require('tap');
const { join } = require('path');
const { readFileSync } = require('fs');
const cp = require('child_process');

function exec(cmd) {
    return new Promise((resolve) => {
        cp.exec(cmd, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr });
        });
    });
}

test('Initializing a new assets.json file', async t => {
    const eik = join(__dirname, '../../index.js');
    const folder = await fs.mkdtemp(join(os.tmpdir(), 'foo-'));

    const publishCmd = `${eik} init --cwd ${folder}`;
    await exec(publishCmd);

    const assets = JSON.parse(
        readFileSync(join(folder, 'assets.json')),
    );

    t.equals(assets.name, '', 'assets.json "name" field should be empty');
    t.equals(assets.major, 1, 'assets.json "major" field should equal 1');
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
});

test('Initializing a new assets.json file passing custom values', async t => {
    const eik = join(__dirname, '../../index.js');
    const folder = await fs.mkdtemp(join(os.tmpdir(), 'foo-'));

    const publishCmd = `${eik} init 
        --cwd ${folder}
        --name custom-name
        --major 2
        --server http://localhost:4001
        --js ./assets/client.js
        --css ./assets/styles.css`;
    await exec(publishCmd.split('\n').join(' '));

    const assets = JSON.parse(
        readFileSync(join(folder, 'assets.json')),
    );

    t.equals(
        assets.name,
        'custom-name',
        'assets.json "name" field should not be empty',
    );
    t.equals(
        assets.major,
        2,
        'assets.json "major" field should not be empty',
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
});
