/* eslint-disable no-param-reassign */

'use strict';

const { test, beforeEach, afterEach } = require('tap');
const fastify = require('fastify');
const EikService = require('@eik/service');
const { sink } = require('@eik/core');
const { mockLogger } = require('./utils');
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

test('Uploading app assets to an asset server', async t => {
    const { address, token } = t.context;
    const l = mockLogger();

    const publishApp = new cli.publish.Package({
        logger: l.logger,
        cwd: __dirname,
        server: address,
        name: 'my-app',
        js: './fixtures/client.js',
        css: './fixtures/styles.css',
        debug: true,
        token,
        version: '1.0.0',
    });

    const result = await publishApp.run();
    t.equals(result.type, 'pkg', 'Command should return correct type');
    t.equals(result.name, 'my-app', 'Command should return correct name');
    t.equals(result.version, '1.0.0', 'Command should return correct version');
    t.equals(result.files.length, 3, 'Command should return files array');
    t.match(l.logs.debug, 'Running package command');
    t.match(l.logs.debug, 'Uploading zip file to server');
    t.match(l.logs.debug, 'Cleaning up');
});

test('Uploading JS app assets only to an asset server', async t => {
    const { address, token } = t.context;
    const l = mockLogger();

    const publishApp = new cli.publish.Package({
        logger: l.logger,
        cwd: __dirname,
        server: address,
        name: 'my-app',
        js: './fixtures/client.js',
        debug: true,
        token,
        version: '1.0.0',
    });

    const result = await publishApp.run();
    t.equals(result.type, 'pkg', 'Command should return correct type');
    t.equals(result.name, 'my-app', 'Command should return correct name');
    t.equals(result.version, '1.0.0', 'Command should return correct version');
    t.equals(result.files.length, 2, 'Command should return files array');
    t.match(l.logs.debug, 'Running package command');
    t.match(l.logs.debug, 'Uploading zip file to server');
    t.match(l.logs.debug, 'Cleaning up');
});

test('Uploading CSS app assets only to an asset server', async t => {
    const { address, token } = t.context;
    const l = mockLogger();

    const publishApp = new cli.publish.Package({
        logger: l.logger,
        cwd: __dirname,
        server: address,
        name: 'my-app',
        css: './fixtures/styles.css',
        debug: true,
        token,
        version: '1.0.0',
    });

    const result = await publishApp.run();
    t.equals(result.type, 'pkg', 'Command should return correct type');
    t.equals(result.name, 'my-app', 'Command should return correct name');
    t.equals(result.version, '1.0.0', 'Command should return corrrect version');
    t.equals(result.files.length, 2, 'Command should return files array');
    t.match(l.logs.debug, 'Running package command');
    t.match(l.logs.debug, 'Uploading zip file to server');
    t.match(l.logs.debug, 'Cleaning up');
});
