/* eslint-disable no-param-reassign */

'use strict';

const os = require('os');
const fs = require('fs').promises;
const { join, basename } = require('path');
const { test, beforeEach, afterEach } = require('tap');
const fastify = require('fastify');
const EikService = require('@eik/service');
const { EikConfig } = require('@eik/common');
const { sink } = require('@eik/core');
const { mockLogger } = require('./utils');
const cli = require('..');

function buildTestConfig(files) {
    return new EikConfig({files: files || {
        './index.js': './fixtures/client.js',
        './index.css': './fixtures/styles.css',
    }}, null, __dirname)
}


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
    
    const cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));

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

test('Uploading app assets to an asset server', async t => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    const publishApp = new cli.publish.Package({
        logger: l.logger,
        cwd,
        server: address,
        name: 'my-app',
        config: buildTestConfig(),
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

test('Uploading app assets to an asset server under npm namespace', async t => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    const publishApp = new cli.publish.Package({
        logger: l.logger,
        cwd,
        server: address,
        name: 'my-app',
        config: buildTestConfig(),
        debug: true,
        token,
        version: '1.0.0',
        npm: true,
    });

    const result = await publishApp.run();
    t.equals(result.type, 'npm', 'Command should return correct type');
    t.equals(result.name, 'my-app', 'Command should return correct name');
    t.equals(result.version, '1.0.0', 'Command should return correct version');
    t.equals(result.files.length, 3, 'Command should return files array');
    t.match(l.logs.debug, 'Running package command');
    t.match(l.logs.debug, 'Uploading zip file to server');
    t.match(l.logs.debug, 'Cleaning up');
});

test('Uploading JS app assets only to an asset server', async t => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    const publishApp = new cli.publish.Package({
        logger: l.logger,
        cwd,
        server: address,
        name: 'my-app',
        config: buildTestConfig({
            './index.js': './fixtures/client.js',
        }),
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
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    const publishApp = new cli.publish.Package({
        logger: l.logger,
        cwd,
        server: address,
        name: 'my-app',
        config: buildTestConfig({
            './index.css': './fixtures/styles.css',
        }),
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

test('Uploading a directory of assets to an asset server', async t => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    const publishApp = new cli.publish.Package({
        logger: l.logger,
        cwd,
        server: address,
        name: 'my-app',
        config: buildTestConfig({
            './icons': './fixtures/icons/**/*',
        }),
        debug: true,
        token,
        version: '1.0.0',
    });

    const result = await publishApp.run();
    t.equals(result.type, 'pkg', 'Command should return correct type');
    t.equals(result.name, 'my-app', 'Command should return correct name');
    t.equals(result.version, '1.0.0', 'Command should return correct version');
    t.equals(result.files.length, 7, 'Command should return files array');
    t.match(l.logs.debug, 'Running package command');
    t.match(l.logs.debug, 'Uploading zip file to server');
    t.match(l.logs.debug, 'Cleaning up');
});

test('Uploading a directory of assets to the root path to an asset server 2', async t => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    const publishApp = new cli.publish.Package({
        logger: l.logger,
        cwd,
        server: address,
        name: 'my-app',
        config: buildTestConfig({
            '/': './fixtures/icons/**/*',
        }),
        debug: true,
        token,
        version: '1.0.0',
    });

    const result = await publishApp.run();
    t.equals(result.type, 'pkg', 'Command should return correct type');
    t.equals(result.name, 'my-app', 'Command should return correct name');
    t.equals(result.version, '1.0.0', 'Command should return correct version');
    t.equals(result.files.length, 7, 'Command should return files array');
    t.match(l.logs.debug, 'Running package command');
    t.match(l.logs.debug, 'Uploading zip file to server');
    t.match(l.logs.debug, 'Cleaning up');
});
