'use strict';

/* eslint-disable no-param-reassign */

const fastify = require('fastify');
const fs = require('fs').promises;
const os = require('os');
const cp = require('child_process');
const { join } = require('path');
const { test, beforeEach, afterEach } = require('tap');
const fetch = require('node-fetch');
const EikService = require('@eik/service');
const { sink } = require('@eik/core');
const cli = require('../..');

function exec(cmd) {
    return new Promise((resolve) => {
        cp.exec(cmd, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr });
        });
    });
}

beforeEach(async (done, t) => {
    const server = fastify({ logger: false });
    const memSink = new sink.MEM();
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen();
    const folder = await fs.mkdtemp(join(os.tmpdir(), 'foo-'));
    const eik = join(__dirname, '../../index.js');

    const token = await new cli.Login({
        server: address,
        key: 'change_me',
    }).run();

    const publishCmd = `${eik} dependency scroll-into-view-if-needed 2.2.24
        --token ${token}
        --server ${address}
        --cwd ${folder}`;

    await exec(publishCmd.split('\n').join(' '));

    const map = {
        imports: {
            'scroll-into-view-if-needed': new URL(
                '/npm/scroll-into-view-if-needed/2.2.24/index.js',
                address,
            ).href,
        },
    };
    await fs.writeFile(join(folder, 'import-map.json'), JSON.stringify(map));
    const mapCmd = `${eik} map test-map 1.0.0 import-map.json
        --token ${token}
        --server ${address}
        --cwd ${folder}`;
    await exec(mapCmd.split('\n').join(' '));

    t.context.server = server;
    t.context.address = address;
    t.context.folder = folder;
    t.context.token = token;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.close();
    done();
});

test('eik npm-alias <name> <version> <alias> --token --server : no assets.json or .eikrc', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} npm-alias scroll-into-view-if-needed 2.2.24 2
        --token ${t.context.token}
        --server ${t.context.address}
        --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd.split('\n').join(' '));

    const res = await fetch(
        new URL('/npm/scroll-into-view-if-needed/v2/index.js', t.context.address),
    );

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'Created npm alias "v2" (for "scroll-into-view-if-needed") and set it to point to version "2.2.24"');
    t.end();
});

test('eik pkg-alias <name> <version> <alias> : publish details provided by assets.json file', async (t) => {
    const assets = {
        name: 'test-app',
        server: t.context.address,
    };
    await fs.writeFile(
        join(t.context.folder, 'assets.json'),
        JSON.stringify(assets),
    );
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} npm-alias scroll-into-view-if-needed 2.2.24 2 --token ${t.context.token} --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(
        new URL('/npm/scroll-into-view-if-needed/v2/index.js', t.context.address),
    );

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'Created npm alias "v2" (for "scroll-into-view-if-needed") and set it to point to version "2.2.24"');
    t.end();
});

test('eik map-alias <name> <version> <alias> --token --server : no assets.json or .eikrc', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} map-alias test-map 1.0.0 1
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

test('eik map-alias <name> <version> <alias> : publish details provided by assets.json file', async (t) => {
    const assets = {
        name: 'test-app',
        server: t.context.address,
    };
    await fs.writeFile(
        join(t.context.folder, 'assets.json'),
        JSON.stringify(assets),
    );
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} map-alias test-map 1.0.0 1 --token ${t.context.token} --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(
        new URL('/map/test-map/v1', t.context.address),
    );

    t.equal(res.ok, true);

    t.notOk(error);
    t.match(stdout, 'Created map alias "v1" (for "test-map") and set it to point to version "1.0.0"');
    t.end();
});
