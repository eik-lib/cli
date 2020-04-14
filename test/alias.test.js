/* eslint-disable no-param-reassign */

'use strict';

const { test, beforeEach, afterEach } = require('tap');
const AssetServer = require('@eik/core/services/fastify');
const { sink } = require('@eik/core');
const { mockLogger } = require('./utils');
const cli = require('..');

beforeEach(async (done, t) => {
    const memSink = new sink.MEM();
    const server = new AssetServer({ 
        customSink: memSink,
        port: 0,
        logger: false,
        config: {
            authKey: 'passkey',
        }
    });
    const address = await server.start();
    
    const login = new cli.Login({
        server: address,
        key: 'passkey',
    });
    const token = await login.run();
    
    t.context.server = server
    t.context.address = address;
    t.context.token = token;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.stop();
    done();
});

test('Creating a package alias on an asset server', async t => {
    const { address, token } = t.context;
    const l = mockLogger();

    await new cli.publish.Dependency({
        server: address,
        name: 'lit-html',
        version: '1.1.2',
        debug: true,
        token,
    }).run();

    const result = await new cli.Alias({
        logger: l.logger,
        server: address,
        type: 'pkg',
        name: 'lit-html',
        version: '1.1.2',
        alias: '1',
        debug: true,
        token,
    }).run();

    t.equals(result, true, 'Command should return true');
});

test('Creating a map alias on an asset server', async t => {
    const { address, token } = t.context;
    const l = mockLogger();

    await new cli.publish.Map({
        cwd: __dirname,
        server: address,
        name: 'my-map',
        version: '1.0.0',
        file: './fixtures/import-map.json',
        debug: true,
        token,
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
    }).run();

    t.equals(result, true, 'Command should return true');
});
