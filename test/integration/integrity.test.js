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

    const token = await cli.login({
        server: address,
        key: 'change_me',
    });

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

test('eik meta : details provided by eik.json', async (t) => {
    const assets = {
        name: 'test-app',
        version: '1.0.0',
        server: t.context.address,
        files: {
            './index.js': join(__dirname, './../fixtures/client.js'),
            './index.css': join(__dirname, './../fixtures/styles.css'),
        },
    };
    await fs.writeFile(
        join(t.context.folder, 'eik.json'),
        JSON.stringify(assets),
    );

    const eik = join(__dirname, '../../index.js');

    let cmd = `${eik} package --token ${t.context.token} --cwd ${t.context.folder}`;
    await exec(cmd);

    cmd = `${eik} integrity --cwd ${t.context.folder}`;
    
    const { error, stdout } = await exec(cmd);

    const integrity = JSON.parse(
        await fs.readFile(
            join(t.context.folder, './.eik/integrity.json'),
            'utf8',
        ),
    );

    t.notOk(error);
    t.match(
        stdout,
        'integrity information for package "test-app" (v1.0.0) saved to ".eik/integrity.json"',
    );
    t.equal(integrity.name, 'test-app');
    t.equal(integrity.version, '1.0.0');
    t.ok(integrity.integrity);
    t.end();
});

test('eik meta : details provided by eik.json - npm namespace', async (t) => {
    const assets = {
        name: 'test-app-npm',
        version: '1.0.0',
        type: 'npm',
        server: t.context.address,
        files: {
            './index.js': join(__dirname, './../fixtures/client.js'),
            './index.css': join(__dirname, './../fixtures/styles.css'),
        },
    };
    await fs.writeFile(
        join(t.context.folder, 'eik.json'),
        JSON.stringify(assets),
    );

    const eik = join(__dirname, '../../index.js');

    let cmd = `${eik} package --token ${t.context.token} --cwd ${t.context.folder}`;
    await exec(cmd);

    cmd = `${eik} integrity --cwd ${t.context.folder}`;
    const { error, stdout } = await exec(cmd);

    const integrity = JSON.parse(
        await fs.readFile(
            join(t.context.folder, './.eik/integrity.json'),
            'utf8',
        ),
    );

    t.notOk(error);
    t.match(
        stdout,
        'integrity information for package "test-app-npm" (v1.0.0) saved to ".eik/integrity.json"',
    );
    t.equal(integrity.name, 'test-app-npm');
    t.equal(integrity.version, '1.0.0');
    t.ok(integrity.integrity);
    t.end();
});
