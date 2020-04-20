'use strict';

/* eslint-disable no-param-reassign */

const fs = require('fs').promises;
const os = require('os');
const cp = require('child_process');
const { join } = require('path');
const { test, beforeEach, afterEach } = require('tap');
const fetch = require('node-fetch');
const AssetServer = require('@eik/core/services/fastify');
const { sink } = require('@eik/core');

function exec(cmd) {
    return new Promise((resolve) => {
        cp.exec(cmd, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr });
        });
    });
}

beforeEach(async (done, t) => {
    const memSink = new sink.MEM();
    const server = new AssetServer({
        customSink: memSink,
        port: 0,
        logger: false,
        config: {
            authKey: 'passkey',
        },
    });
    const address = await server.start();
    const folder = await fs.mkdtemp(join(os.tmpdir(), 'foo-'));
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} login --key passkey --server ${address} --cwd ${folder}`;
    await exec(cmd);
    const eikrc = JSON.parse(await fs.readFile(join(folder, '.eikrc')));

    const publishCmd = `${eik} dependency lodash 4.17.0
        --token ${eikrc.token}
        --server ${address}
        --cwd ${folder}`;

    await exec(publishCmd.split('\n').join(' '));

    const map = {
        imports: {
            lodash: new URL('/pkg/lodash/4.17.0/index.js', address).href,
        },
    };
    await fs.writeFile(
        join(folder, 'import-map.json'),
        JSON.stringify(map),
    );
    const mapCmd = `${eik} map test-map 1.0.0 import-map.json
        --token ${eikrc.token}
        --server ${address}
        --cwd ${folder}`;
    await exec(mapCmd.split('\n').join(' '));

    t.context.server = server;
    t.context.address = address;
    t.context.folder = folder;
    t.context.token = eikrc.token;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.stop();
    done();
});

test('eik alias pkg <name> <version> <alias> --token --server : no assets.json or .eikrc', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} alias pkg lodash 4.17.0 4
        --token ${t.context.token}
        --server ${t.context.address}
        --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd.split('\n').join(' '));

    const res = await fetch(
        new URL('/pkg/lodash/v4/index.js', t.context.address),
    );

    t.equal(res.ok, true);
    
    t.notOk(error);
    t.match(stdout, 'Created pkg alias "v4" (for "lodash") and set it to point to version "4.17.0"');
    t.end();
});

test('eik alias pkg <name> <version> <alias> : publish details provided by assets.json file and .eikrc', async (t) => {
    const assets = {
        name: 'test-app',
        server: t.context.address,
    };
    await fs.writeFile(
        join(t.context.folder, 'assets.json'),
        JSON.stringify(assets),
    );
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} alias pkg lodash 4.17.0 4 --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(
        new URL('/pkg/lodash/v4/index.js', t.context.address),
    );

    t.equal(res.ok, true);
    
    t.notOk(error);
    t.match(stdout, 'Created pkg alias "v4" (for "lodash") and set it to point to version "4.17.0"');
    t.end();
});

test('eik alias map <name> <version> <alias> --token --server : no assets.json or .eikrc', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} alias map test-map 1.0.0 1
        --token ${t.context.token}
        --server ${t.context.address}
        --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd.split('\n').join(' '));

    const res = await fetch(
        new URL('/map/test-map/v1', t.context.address),
    );

    t.equal(res.ok, true);
    
    t.notOk(error);
    t.match(stdout, 'Created map alias "v1" (for "test-map") and set it to point to version "1.0.0"');
    t.end();
});

test('eik alias map <name> <version> <alias> : publish details provided by assets.json file and .eikrc', async (t) => {
    const assets = {
        name: 'test-app',
        server: t.context.address,
    };
    await fs.writeFile(
        join(t.context.folder, 'assets.json'),
        JSON.stringify(assets),
    );
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} alias map test-map 1.0.0 1 --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(
        new URL('/map/test-map/v1', t.context.address),
    );

    t.equal(res.ok, true);
    
    t.notOk(error);
    t.match(stdout, 'Created map alias "v1" (for "test-map") and set it to point to version "1.0.0"');
    t.end();
});