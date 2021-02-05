/* eslint-disable no-param-reassign */

'use strict';

const os = require('os');
const fs = require('fs').promises;
const { join, basename } = require('path');
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
    
    const cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));

    t.context.server = server
    t.context.address = address;
    t.context.token = token;
    t.context.cwd = cwd;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.close();
    done();
});

test('Uploading import map to an asset server', async t => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    const publishMap = new cli.publish.Map({
        logger: l.logger,
        cwd,
        server: address,
        name: 'my-map',
        version: '1.0.0',
        file: join(__dirname, './fixtures/import-map.json'),
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
