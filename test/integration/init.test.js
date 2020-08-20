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

test('Initializing a new eik.json file', async t => {
    const eik = join(__dirname, '../../index.js');
    const folder = await fs.mkdtemp(join(os.tmpdir(), 'foo-'));

    const publishCmd = `${eik} init --cwd ${folder}`;
    await exec(publishCmd);

    const assets = JSON.parse(
        readFileSync(join(folder, 'eik.json')),
    );

    t.equals(assets.name, '', 'eik.json "name" field should be empty');
    t.equals(assets.major, 1, 'eik.json "major" field should equal 1');
    t.equals(assets.server, '', 'eik.json "server" field should be empty');
    t.same(
        assets.files,
        {},
        'eik.json "files" should be an empty object',
    );
});

test('Initializing a new eik.json file passing custom values', async t => {
    const eik = join(__dirname, '../../index.js');
    const folder = await fs.mkdtemp(join(os.tmpdir(), 'foo-'));

    const publishCmd = `${eik} init 
        --cwd ${folder}
        --name custom-name
        --major 2
        --server http://localhost:4001`;
    await exec(publishCmd.split('\n').join(' '));

    const assets = JSON.parse(
        readFileSync(join(folder, 'eik.json')),
    );

    t.equals(
        assets.name,
        'custom-name',
        'eik.json "name" field should not be empty',
    );
    t.equals(
        assets.major,
        2,
        'eik.json "major" field should not be empty',
    );
    t.equals(
        assets.server,
        'http://localhost:4001',
        'eik.json "server" field should not be empty',
    );
    t.same(
        assets.files,
        {},
        'eik.json "js.input" field should not be empty',
    );
});
