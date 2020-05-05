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

test('eik publish --token --server : no assets.json', async (t) => {
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

test('eik publish : publish, details provided by assets.json file', async (t) => {
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
    const cmd = `${eik} publish --token ${t.context.token} --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(
        new URL('/pkg/test-app/1.0.0/main/index.js', t.context.address),
    );

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'Published app package "test-app" at version "1.0.0"');
    t.end();
});

test('workflow: publish dep, alias dep, publish map, alias map and then publish using map', async (t) => {
    const eik = join(__dirname, '../../index.js');
    let cmd = '';
    
    // publish npm dep
    cmd = `${eik} dep scroll-into-view-if-needed 2.2.24
        --token ${t.context.token} 
        --server ${t.context.address}`;
    await exec(cmd.split('\n').join(' '));

    // alias npm dependency
    cmd = `${eik} npm-alias scroll-into-view-if-needed 2.2.24 2
        --token ${t.context.token} 
        --server ${t.context.address}`;
    await exec(cmd.split('\n').join(' '));

    // create import map file locally
    const map = {
        imports: {
            'scroll-into-view-if-needed': new URL(
                '/npm/scroll-into-view-if-needed/v2/index.js',
                t.context.address,
            ).href,
        },
    };
    await fs.writeFile(
        join(t.context.folder, 'import-map.json'),
        JSON.stringify(map),
    );

    // upload import map file
    cmd = `${eik} map my-map 1.0.0 ./import-map.json
        --cwd ${t.context.folder}
        --token ${t.context.token}
        --server ${t.context.address}`;
    await exec(cmd.split('\n').join(' '));

    // alias import map
    cmd = `${eik} map-alias my-map 1.0.0 1
        --token ${t.context.token} 
        --server ${t.context.address}`;
    await exec(cmd.split('\n').join(' '));

    // use import map when publishing app files
    cmd = `${eik} publish
        --name test-app 
        --token ${t.context.token}
        --server ${t.context.address}
        --cwd ${t.context.folder}
        --map ${new URL('/map/my-map/v1', t.context.address).href}
        --debug
        --js ${join(__dirname, '..', 'fixtures', 'client-with-bare-imports.js')}`;
    await exec(cmd.split('\n').join(' '));

    const res = await fetch(new URL('/pkg/test-app/1.0.0/main/index.js', t.context.address));
    const text = await res.text();

    t.equal(res.ok, true);
    t.match(text, new URL(
        '/npm/scroll-into-view-if-needed/v2/index.js',
        t.context.address,
    ).href)
});
