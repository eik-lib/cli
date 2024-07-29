'use strict';

/* eslint-disable no-param-reassign */
const fastify = require('fastify');
const fs = require('fs').promises;
const os = require('os');
const cp = require('child_process');
const { join, basename } = require('path');
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

beforeEach(async (t) => {
    const memSink = new sink.MEM();
    const server = fastify({ logger: false });
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen({
        host: '127.0.0.1',
        port: 0,
    });
    const folder = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));

    const token = await cli.login({
        server: address,
        key: 'change_me',
    });

    t.context.server = server;
    t.context.address = address;
    t.context.folder = folder;
    t.context.token = token;
});

afterEach(async (t) => {
    await t.context.server.close();
});

test('eik map : publish, details provided by eik.json file', async (t) => {
    const assets = {
        name: 'scroll-into-view-if-needed',
        version: '2.2.24',
        server: t.context.address,
        files: {
            'index.js': join(__dirname, './../fixtures/client.js'),
            'index.css': join(__dirname, './../fixtures/styles.css'),
        },
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
