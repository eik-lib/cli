'use strict';

/* eslint-disable no-param-reassign */

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
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} login --key passkey --server ${address} --cwd ${folder}`;
    await exec(cmd);
    const eikrc = JSON.parse(await fs.readFile(join(folder, '.eikrc')));

    const depcmd = `${eik} dep lodash 4.17.0 -t ${eikrc.token} -s ${address} -c ${folder}`;
    await exec(depcmd);

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

test('eik meta --server : no assets.json or .eikrc', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} meta lodash 4.17.0 --server ${t.context.address}`;

    const { error, stdout } = await exec(cmd);

    t.notOk(error);
    t.match(stdout, ':: pkg lodash v4.17.0');
    t.end();
});

test('eik meta : details provided by assets.json', async (t) => {
    const assets = {
        name: 'test-app',
        server: t.context.address,
    };
    await fs.writeFile(
        join(t.context.folder, 'assets.json'),
        JSON.stringify(assets),
    );

    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} meta lodash 4.17.0 --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);
    
    t.notOk(error);
    t.match(stdout, ':: pkg lodash v4.17.0');
    t.end();
});
