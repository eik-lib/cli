'use strict';

/* eslint-disable no-param-reassign */

const fs = require('fs').promises;
const os = require('os');
const cp = require('child_process');
const { join } = require('path');
const { test, beforeEach, afterEach } = require('tap');
const fetch = require('node-fetch');
const AssetServer = require('@eik/service');
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
    const server = new AssetServer({ customSink: memSink });
    const address = await server.start();
    const folder = await fs.mkdtemp(join(os.tmpdir(), 'foo-'));
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} login --key change_me --server ${address} --cwd ${folder}`;
    await exec(cmd);
    const eikrc = JSON.parse(await fs.readFile(join(folder, '.eikrc')));

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

test('eik publish --token --server : no assets.json or .eikrc', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} publish
        --name test-app 
        --token ${t.context.token}
        --server ${t.context.address}
        --cwd ${t.context.folder}
        --js ${join(__dirname, '..', 'fixtures', 'client.js')}
        --css ${join(__dirname, '..', 'fixtures', 'styles.css')}`;

    const { error, stdout } = await exec(cmd.split('\n').join(' '));

    const res = await fetch(
        new URL('/pkg/test-app/1.0.0/main/index.js', t.context.address),
    );

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'Published app package "test-app" at version "1.0.0"');
    t.end();
});

test('eik publish : publish, details provided by assets.json file and .eikrc', async (t) => {
    const assets = {
        name: 'test-app',
        server: t.context.address,
        js: { input: join(__dirname, '..', 'fixtures', 'client.js') },
        css: { input: join(__dirname, '..', 'fixtures', 'styles.css') },
    };
    await fs.writeFile(
        join(t.context.folder, 'assets.json'),
        JSON.stringify(assets),
    );

    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} publish --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(
        new URL('/pkg/test-app/1.0.0/main/index.js', t.context.address),
    );

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'Published app package "test-app" at version "1.0.0"');
    t.end();
});
