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
    t.equals(result, true, 'Command should return true');
    t.match(
        l.logs.debug,
        'Uploading import map "my-map" version "1.0.0" to asset server',
        'Log output should show published name, version and org',
    );
    t.match(
        l.logs.info,
        'Published import map "my-map" at version "1.0.0"',
        'Log output should command completion',
    );
});
