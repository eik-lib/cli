/* eslint-disable no-param-reassign */

'use strict';

const fastify = require('fastify');
const { test, beforeEach, afterEach } = require('tap');
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
    
    t.context.server = server
    t.context.address = address;
    t.context.token = token;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.close();
    done();
});

test('Uploading import map to an asset server', async t => {
    const { address, token } = t.context;
    const l = mockLogger();

    const publishMap = new cli.publish.Map({
        logger: l.logger,
        cwd: __dirname,
        server: address,
        name: 'my-map',
        version: '1.0.0',
        file: './fixtures/import-map.json',
        debug: true,
        token,
    });

    const result = await publishMap.run();
    t.same(result, {
        name: 'my-map',
        version: '1.0.0',
        server: address,
        type: 'map',
    }, 'Command should return an object');
    t.match(
        l.logs.debug,
        'Uploading import map "my-map" version "1.0.0" to asset server',
        'Log output should show published name, version and org',
    );
});
