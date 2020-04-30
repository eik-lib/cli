/* eslint-disable no-param-reassign */

'use strict';

// const util = require('util');
const fastify = require('fastify');
const fs = require('fs').promises;
const os = require('os');
const cp = require('child_process');
const { join } = require('path');
const { test, beforeEach, afterEach } = require('tap');
const EikService = require('@eik/service');
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
    const server = fastify({ logger: false });
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen();

    const folder = await fs.mkdtemp(join(os.tmpdir(), 'foo-'));

    t.context.server = server;
    t.context.address = address;
    t.context.folder = folder;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.close();
    done();
});

test('eik login --key --server --cwd : valid key', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} login --key change_me --server ${t.context.address} --cwd ${t.context.folder}`;

    const { stdout } = await exec(cmd);

    t.match(stdout, 'Login successful');
    t.end();
});

test('eik login --key --server --cwd : invalid key', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} login --key invalid --server ${t.context.address} --cwd ${t.context.folder}`;

    const { stdout } = await exec(cmd);
    t.match(stdout, 'Login unsuccessful');
    t.end();
});
