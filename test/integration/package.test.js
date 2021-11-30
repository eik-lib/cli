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
});

afterEach(async (t) => {
    await t.context.server.close();
});

test('eik package : package, details provided by eik.json file', async (t) => {
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
    const cmd = `${eik} package --token ${t.context.token} --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(
        new URL('/pkg/test-app/1.0.0/index.js', t.context.address),
    );

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'published');
    t.match(stdout, 'less than a minute ago');
    t.match(stdout, 'Generic User');
    t.end();
});

test('eik package : package, details provided by eik.json file - npm namespace', async (t) => {
    const assets = {
        name: 'test-app',
        version: '1.0.0',
        type: 'npm',
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
    const cmd = `${eik} package --token ${t.context.token} --cwd ${t.context.folder} --npm`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(
        new URL('/npm/test-app/1.0.0/index.js', t.context.address),
    );

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'NPM');
    t.match(stdout, 'less than a minute ago');
    t.match(stdout, 'Generic User');
    t.end();
});

test('eik package : package, details provided by eik.json file - explicit package namespace', async (t) => {
    const assets = {
        name: 'test-app',
        version: '1.0.0',
        type: 'package',
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
    const cmd = `${eik} package --token ${t.context.token} --cwd ${t.context.folder} --npm`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(
        new URL('/pkg/test-app/1.0.0/index.js', t.context.address),
    );

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'PACKAGE');
    t.match(stdout, 'less than a minute ago');
    t.match(stdout, 'Generic User');
    t.end();
});

test('eik package : package, details provided by package.json values', async (t) => {
    const assets = {
        name: 'test-app',
        version: '1.0.0',
        eik: {
            server: t.context.address,
            files: {
                'index.js': join(__dirname, './../fixtures/client.js'),
                'index.css': join(__dirname, './../fixtures/styles.css'),
            },
        },
    };

    await fs.writeFile(
        join(t.context.folder, 'package.json'),
        JSON.stringify(assets),
    );

    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} package --token ${t.context.token} --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(
        new URL('/pkg/test-app/1.0.0/index.js', t.context.address),
    );

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'published');
    t.match(stdout, 'less than a minute ago');
    t.match(stdout, 'Generic User');
    t.end();
});

test('eik package : package, details provided by package.json values and eik.json, throws error', async (t) => {
    const pkg = {
        name: 'test-app',
        version: '1.0.0',
        eik: {
            server: t.context.address,
            files: {
                'index.js': join(__dirname, './../fixtures/client.js'),
                'index.css': join(__dirname, './../fixtures/styles.css'),
            },
        },
    };

    await fs.writeFile(
        join(t.context.folder, 'package.json'),
        JSON.stringify(pkg),
    );

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
    const cmd = `${eik} package --token ${t.context.token} --cwd ${t.context.folder}`;

    const { error } = await exec(cmd);

    t.ok(error);
    t.match(
        error,
        /Eik configuration was defined in both in package.json and eik.json/,
    );
    t.end();
});

test('workflow: publish npm, alias npm, publish map, alias map and then publish package using map', async (t) => {
    const eik = join(__dirname, '../../index.js');
    let cmd = '';

    // publish npm dep
    let assets = {
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

    cmd = `${eik} package --token ${t.context.token} --cwd ${t.context.folder} --npm`;
    await exec(cmd);

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

    assets = {
        name: 'test-app',
        version: '1.0.0',
        server: t.context.address,
        files: {
            'index.js': join(
                __dirname,
                './../fixtures/client-with-bare-imports.js',
            ),
            'index.css': join(__dirname, './../fixtures/styles.css'),
        },
        'import-map': [new URL('/map/my-map/v1', t.context.address).href],
    };
    await fs.writeFile(
        join(t.context.folder, 'eik.json'),
        JSON.stringify(assets),
    );

    // TODO: create a bundle that uses import maps

    // use import map when publishing app files
    // cmd = `${eik} package
    //     --token ${t.context.token}
    //     --cwd ${t.context.folder}
    //     --debug`;
    // await exec(cmd.split('\n').join(' '));

    // const res = await fetch(new URL('/pkg/test-app/1.0.0/index.js', t.context.address));
    // const text = await res.text();

    // t.equal(res.ok, true);
    // t.match(text, new URL(
    //     '/npm/scroll-into-view-if-needed/v2/index.js',
    //     t.context.address,
    // ).href)
});
