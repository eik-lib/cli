/* eslint-disable no-param-reassign */

'use strict';

const { join } = require('path');
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

    t.context.server = server;
    t.context.address = address;
    t.context.token = token;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.close();
    done();
});

test('Current version unpublished - rejects with error', async t => {
    const { address } = t.context;

    try {
        await new cli.Version({
            cwd: __dirname,
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
    const { address, token } = t.context;

    await new cli.publish.Package({
        cwd: __dirname,
        server: address,
        name: 'my-app',
        files: {
            './index.js': join(__dirname, './fixtures/client.js'),
            './index.css': join(__dirname, './fixtures/styles.css'),
        },
        token,
        version: '1.0.0',
    }).run();

    try {
        await new cli.Version({
            cwd: __dirname,
            server: address,
            name: 'my-app',
            files: {
                './index.js': join(__dirname, './fixtures/client.js'),
                './index.css': join(__dirname, './fixtures/styles.css'),
            },
            version: '1.0.0',
        }).run();
    } catch (err) {
        t.equals(err.message, 'The current version of this package already contains these files, version change is not needed.');
    }
});

test('Current version published - files changed - bumps version', async t => {
    const { address, token } = t.context;

    await new cli.publish.Package({
        cwd: __dirname,
        server: address,
        name: 'my-app',
        files: {
            './index.js': join(__dirname, './fixtures/client.js'),
            './index.css': join(__dirname, './fixtures/styles.css'),
        },
        token,
        version: '1.0.0',
    }).run();

    const newVersion = await new cli.Version({
        cwd: __dirname,
        server: address,
        name: 'my-app',
        files: { './index.js': join(__dirname, './fixtures/client.js') },
        version: '1.0.0',
    }).run();

    t.equals(newVersion, '1.0.1');
});
