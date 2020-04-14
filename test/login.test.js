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
    t.context.server = server
    t.context.address = address;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.stop();
    done();
});

test('Logging in to an asset server', async t => {
    const { address } = t.context;
    const l = mockLogger();
    
    const login = new cli.Login({
        server: address,
        key: 'passkey',
        logger: l.logger,
    });

    const token = await login.run();

    t.equal(token.length, 181, 'Command should return a token');
    t.equal(l.logs.info, 'Login successful', 'Logs should indicate success');
});

test('Logging in to an asset server', async t => {
    const { address } = t.context;
    const l = mockLogger();
    
    const login = new cli.Login({
        server: address,
        key: 'incorrectkey',
        logger: l.logger,
    });

    const result = await login.run();

    t.equal(result, false, 'Command should return false on failure');
    t.equal(l.logs.info, 'Login unsuccessful. Invalid credentials.', 'Logs should indicate failure');
});
