/* eslint-disable no-param-reassign */

'use strict';

const os = require('os');
const fs = require('fs').promises;
const { join } = require('path');
const { test, beforeEach, afterEach } = require('tap');
const EikService = require('@eik/service');
const fastify = require('fastify');
const { sink } = require('@eik/core');
const { mockLogger } = require('./utils');
const cli = require('..');

beforeEach(async (done, t) => {
    const server = fastify({ logger: false });
    const memSink = new sink.MEM();
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen();

    const login = new cli.Login({
        server: address,
        key: 'change_me',
    });
    const token = await login.run();

    const cwd = await fs.mkdtemp(join(os.tmpdir(), 'foo-'));

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

test('Creating a package alias', async t => {
    const { address, token, cwd } = t.context;

    await new cli.publish.Package({
        server: address,
        name: 'my-pack',
        files: {
            './index.js': join(__dirname, './fixtures/client.js'),
            './index.css': join(__dirname, './fixtures/styles.css'),
        },
        token,
        cwd,
    }).run();

    const result = await new cli.Alias({
        server: address,
        type: 'pkg',
        name: 'my-pack',
        version: '1.0.0',
        alias: '1',
        token,
        cwd,
    }).run();

    t.match(result.server, '127.0.0.1', 'server property should return "127.0.0.1"');
    t.equals(result.type, 'pkg', 'type property should return "pkg"');
    t.equals(result.name, 'my-pack', 'name property should return "my-pack"');
    t.equals(result.alias, '1', 'alias property should return 1');
    t.equals(result.version, '1.0.0', 'version property should return 1.0.0');
    t.equals(result.update, false, 'update property should return false');
    t.equals(result.files.length, 3, 'files property should be 3');
    t.equals(result.org, 'local', 'org property should return an organisation');
    t.match(result.integrity, '==', 'integrity property should contain an integrity string');
});

test('Creating an npm alias', async (t) => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    await new cli.publish.NPM({
        server: address,
        name: 'lit-html',
        version: '1.1.2',
        debug: true,
        token,
        cwd,
    }).run();

    const result = await new cli.Alias({
        logger: l.logger,
        server: address,
        type: 'npm',
        name: 'lit-html',
        version: '1.1.2',
        alias: '1',
        debug: true,
        token,
        cwd,
    }).run();

    t.match(
        result.server,
        '127.0.0.1',
        'server property should return "127.0.0.1"',
    );
    t.equals(result.type, 'npm', 'type property should return "npm"');
    t.equals(result.name, 'lit-html', 'name property should return "lit-html"');
    t.equals(result.alias, '1', 'alias property should return 1');
    t.equals(result.version, '1.1.2', 'version property should return 1.1.2');
    t.equals(result.update, false, 'update property should return false');
    t.equals(result.files.length, 2, 'files property should be 2');
    t.equals(result.org, 'local', 'org property should return an organisation');
    t.match(
        result.integrity,
        '==',
        'integrity property should contain an integrity string',
    );
});

test('Creating a map alias', async (t) => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    await new cli.publish.Map({
        server: address,
        name: 'my-map',
        version: '1.0.0',
        file: join(__dirname, 'fixtures/import-map.json'),
        debug: true,
        token,
        cwd,
    }).run();

    const result = await new cli.Alias({
        logger: l.logger,
        server: address,
        type: 'map',
        name: 'my-map',
        version: '1.0.0',
        alias: '1',
        debug: true,
        token,
        cwd,
    }).run();

    t.match(
        result.server,
        '127.0.0.1',
        'server property should return "127.0.0.1"',
    );
    t.equals(result.type, 'map', 'type property should return "map"');
    t.equals(result.name, 'my-map', 'name property should return "my-map"');
    t.equals(result.alias, '1', 'alias property should return 1');
    t.equals(result.version, '1.0.0', 'version property should return 1.0.0');
    t.equals(result.update, false, 'update property should return false');
    t.equals(result.files.length, 0, 'files property should be 0');
    t.notOk(result.org, 'org property should not be present');
    t.notOk(result.integrity, 'integrity property should not be present');
});
