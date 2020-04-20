/* eslint-disable no-param-reassign */

'use strict';

// const util = require('util');
const fs = require('fs').promises;
const os = require('os');
const cp = require('child_process');
const { join } = require('path');
const { test, beforeEach, afterEach } = require('tap');
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

    t.context.server = server;
    t.context.address = address;
    t.context.folder = folder;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.stop();
    done();
});

test('eik login --key --server --cwd : valid key', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} login --key passkey --server ${t.context.address} --cwd ${t.context.folder}`;

    const { stderr, stdout } = await exec(cmd);

    t.notOk(stderr);
    t.match(stdout, 'Login successful');
    t.end();
});

test('eik login --key --server --cwd : invalid key', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} login --key invalid --server ${t.context.address} --cwd ${t.context.folder}`;

    const { error, stderr, stdout } = await exec(cmd);

    t.ok(error);
    t.notOk(stderr);
    t.match(stdout, 'Login unsuccessful');
    t.end();
});
