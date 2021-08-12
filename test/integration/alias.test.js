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

beforeEach(async (done, t) => {
    const server = fastify({ logger: false });
    const memSink = new sink.MEM();
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen();
    const folder = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
    const eik = join(__dirname, '../../index.js');

    const token = await cli.login({
        server: address,
        key: 'change_me',
    });

    const assets = {
        name: 'scroll-into-view-if-needed',
        version: '2.2.24',
        type: 'npm',
        server: address,
        files: {
            'index.js': join(__dirname, './../fixtures/client.js'),
            'index.css': join(__dirname, './../fixtures/styles.css'),
        },
    };

    await fs.writeFile(join(folder, 'eik.json'), JSON.stringify(assets));

    const cmd = `${eik} package --token ${token} --cwd ${folder}`;
    await exec(cmd);

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

test('eik package-alias <name> <version> <alias>', async (t) => {
    const { address, token, folder: cwd } = t.context;
    const eik = join(__dirname, '../../index.js');

    const assets = {
        server: address,
        name: 'my-pack',
        version: '1.0.0',
        files: {
            'index.js': join(__dirname, '../fixtures/client.js'),
            'index.css': join(__dirname, '../fixtures/styles.css'),
        },
    };

    await fs.writeFile(join(cwd, 'eik.json'), JSON.stringify(assets));

    const cmd1 = `${eik} package --token ${token} --cwd ${cwd}`;
    await exec(cmd1);

    const cmd2 = `${eik} package-alias my-pack 1.0.0 1
        --token ${token}
        --server ${address}
        --cwd ${cwd}`;

    const { error, stdout } = await exec(cmd2.split('\n').join(' '));

    const res = await fetch(new URL('/pkg/my-pack/v1/index.js', address));

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'PACKAGE');
    t.match(stdout, 'my-pack');
    t.match(stdout, '1.0.0');
    t.match(stdout, 'v1');
    t.match(stdout, 'NEW');
});

test('eik npm-alias <name> <version> <alias> --token --server : no eik.json or .eikrc', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} npm-alias scroll-into-view-if-needed 2.2.24 2
        --token ${t.context.token}
        --server ${t.context.address}
        --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd.split('\n').join(' '));

    const res = await fetch(
        new URL(
            '/npm/scroll-into-view-if-needed/v2/index.js',
            t.context.address,
        ),
    );

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'NPM');
    t.match(stdout, 'scroll-into-view-if-needed');
    t.match(stdout, '2.2.24');
    t.match(stdout, 'v2');
    t.match(stdout, 'NEW');
    t.end();
});

test('eik npm-alias <name> <version> <alias> : publish details provided by eik.json file', async (t) => {
    const assets = {
        name: 'test-app',
        version: '1.0.0',
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
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} npm-alias scroll-into-view-if-needed 2.2.24 2 --token ${t.context.token} --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(
        new URL(
            '/npm/scroll-into-view-if-needed/v2/index.js',
            t.context.address,
        ),
    );

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'NPM');
    t.match(stdout, 'scroll-into-view-if-needed');
    t.match(stdout, '2.2.24');
    t.match(stdout, 'v2');
    t.match(stdout, 'NEW');
    t.end();
});

test('eik map-alias <name> <version> <alias> --token --server : no eik.json or .eikrc', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} map-alias test-map 1.0.0 1
        --token ${t.context.token}
        --server ${t.context.address}
        --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd.split('\n').join(' '));

    const res = await fetch(new URL('/map/test-map/v1', t.context.address));

    t.equal(res.ok, true);

    t.notOk(error);
    t.match(stdout, 'MAP');
    t.match(stdout, 'test-map');
    t.match(stdout, '1.0.0');
    t.match(stdout, 'v1');
    t.match(stdout, 'NEW');
    t.end();
});

test('eik map-alias <name> <version> <alias> : publish details provided by eik.json file', async (t) => {
    const assets = {
        name: 'test-app',
        version: '1.0.0',
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
    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} map-alias test-map 1.0.0 1 --token ${t.context.token} --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(new URL('/map/test-map/v1', t.context.address));

    t.equal(res.ok, true);

    t.notOk(error);
    t.match(stdout, 'MAP');
    t.match(stdout, 'test-map');
    t.match(stdout, '1.0.0');
    t.match(stdout, 'v1');
    t.match(stdout, 'NEW');
    t.end();
});
