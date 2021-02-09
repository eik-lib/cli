/* eslint-disable no-param-reassign */

'use strict';

const fs = require('fs');
const os = require('os');
const { join, basename } = require('path');
const { test, beforeEach, afterEach } = require('tap');
const fastify = require('fastify');
const EikService = require('@eik/service');
const { sink } = require('@eik/core');
const cli = require('..');

beforeEach(async (done, t) => {
    const memSink = new sink.MEM();
    const server = fastify({ logger: false });
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen();

    const login = new cli.Login({
        server: address,
        key: 'change_me',
    });
    const token = await login.run();

    const cwd = await fs.mkdtempSync(join(os.tmpdir(), basename(__filename)));

    t.context.server = server;
    t.context.address = address;
    t.context.token = token;
    t.context.cwd = cwd;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.close();
    done();
});

test('Current version unpublished - rejects with error', async t => {
    const { address, cwd } = t.context;

    try {
        await new cli.Version({
            cwd,
            server: address,
            name: 'my-app',
            files: {
                './index.js': join(__dirname, './fixtures/client.js'),
                './index.css': join(__dirname, './fixtures/styles.css'),
            },
            version: '1.0.0',
        }).run();
    } catch (err) {
        t.equals(err.message, 'The current version of this package has not yet been published, version change is not needed.');
    }
});

test('Current version published - files the same - rejects with error', async t => {
    const { address, token, cwd } = t.context;
    const config  = {
        cwd,
        server: address,
        name: 'my-app',
        files: {
            './index.js': join(__dirname, './fixtures/client.js'),
            './index.css': join(__dirname, './fixtures/styles.css'),
        },
        token,
        version: '1.0.0',
    };

    await new cli.publish.Package(config).run();

    try {
        await new cli.Version(config).run();
    } catch (err) {
        t.equals(err.message, 'The current version of this package already contains these files, version change is not needed.');
    }
});

test('Current version published - files changed - bumps version', async t => {
    const { address, token, cwd } = t.context;
    const config  = {
        cwd,
        server: address,
        name: 'my-app',
        files: {
            './index.js': join(__dirname, './fixtures/client.js'),
            './index.css': join(__dirname, './fixtures/styles.css'),
        },
        token,
        version: '1.0.0',
    };

    await new cli.publish.Package(config).run();

    const newVersion = await new cli.Version({
        ...config,
        files: { './index.js': join(__dirname, './fixtures/client.js') },
    }).run();

    t.equals(newVersion, '1.0.1');
});
