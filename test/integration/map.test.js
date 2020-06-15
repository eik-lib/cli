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
    const memSink = new sink.MEM();
    const server = fastify({ logger: false });
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen();
    const folder = await fs.mkdtemp(join(os.tmpdir(), 'foo-'));

    const token = await new cli.Login({
        server: address,
        key: 'change_me',
    }).run();

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

test('eik map --token --server : no eik.json or .eikrc', async (t) => {
    const map = {
        imports: {
            'scroll-into-view-if-needed': new URL(
                '/pkg/scroll-into-view-if-needed/2.2.24/index.js',
                t.context.address,
            ).href,
        },
    };
    await fs.writeFile(
        join(t.context.folder, 'import-map.json'),
        JSON.stringify(map),
    );

    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} map test-map 1.0.0 import-map.json
        --token ${t.context.token}
        --server ${t.context.address}
        --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd.split('\n').join(' '));

    const res = await fetch(new URL('/map/test-map/1.0.0', t.context.address));
    const result = await res.json();

    t.equal(res.ok, true);
    t.same(result, map);
    t.notOk(error);
    t.match(stdout, 'Published import map "test-map" at version "1.0.0"');
    t.end();
});

test('eik map : publish, details provided by eik.json file', async (t) => {
    const assets = {
        name: 'test-app',
        server: t.context.address,
    };
    await fs.writeFile(
        join(t.context.folder, 'eik.json'),
        JSON.stringify(assets),
    );

    const map = {
        imports: {
            'scroll-into-view-if-needed': new URL(
                '/npm/scroll-into-view-if-needed/2.2.24/index.js',
                t.context.address,
            ).href,
        },
    };
    await fs.writeFile(
        join(t.context.folder, 'import-map.json'),
        JSON.stringify(map),
    );

    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} map test-map 1.0.0 import-map.json --token ${t.context.token} --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(new URL('/map/test-map/1.0.0', t.context.address));
    const result = await res.json();

    t.equal(res.ok, true);
    t.same(result, map);
    t.notOk(error);
    t.match(stdout, 'Published import map "test-map" at version "1.0.0"');
    t.end();
});
