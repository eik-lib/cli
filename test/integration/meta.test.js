'use strict';

/* eslint-disable no-param-reassign */
const fastify = require('fastify');
const fs = require('fs').promises;
const os = require('os');
const cp = require('child_process');
const { join, basename } = require('path');
const { test, beforeEach, afterEach } = require('tap');
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
    const folder = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
    const eik = join(__dirname, '../../index.js');

    const token = await new cli.Login({
        server: address,
        key: 'change_me',
    }).run();

    const assets = {
        name: 'scroll-into-view-if-needed',
        version: '2.2.24',
        server: address,
        files: {
            './index.js': join(__dirname, './../fixtures/client.js'),
            './index.css': join(__dirname, './../fixtures/styles.css'),
        },
    };

    await fs.writeFile(join(folder, 'eik.json'), JSON.stringify(assets));

    const cmd = `${eik} package --token ${token} --cwd ${folder} --npm`;
    await exec(cmd);

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

test('eik meta', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} meta scroll-into-view-if-needed --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    t.notOk(error);
    t.match(stdout, '::');
    t.match(stdout, 'NPM');
    t.match(stdout, 'scroll-into-view-if-needed');
    t.end();
});
