/* eslint-disable no-param-reassign */

'use strict';

const { test, beforeEach, afterEach } = require('tap');
const fastify = require('fastify');
const EikService = require('@eik/service');
const { sink } = require('@eik/core');
const { mockLogger } = require('./utils');
const cli = require('..');

beforeEach(async (t) => {
    const memSink = new sink.MEM();
    const server = fastify({ logger: false });
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen();
    t.context.server = server;
    t.context.address = address;
});

afterEach(async (t) => {
    await t.context.server.close();
});

test('Logging in to an asset server', async (t) => {
    const { address } = t.context;
    const l = mockLogger();

    const token = await cli.login({
        server: address,
        key: 'change_me',
        logger: l.logger,
    });

    t.equal(token.length, 187, 'Command should return a token');
    t.equal(l.logs.info, 'Login successful', 'Logs should indicate success');
});

test('Logging in to an asset server', async (t) => {
    const { address } = t.context;
    const l = mockLogger();

    const result = await cli.login({
        server: address,
        key: 'incorrectkey',
        logger: l.logger,
    });

    t.equal(result, false, 'Command should return false on failure');
    t.equal(
        l.logs.info,
        'Login unsuccessful. Invalid credentials.',
        'Logs should indicate failure',
    );
});
