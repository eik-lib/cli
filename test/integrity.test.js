/* eslint-disable no-param-reassign */

'use strict';

const { join } = require('path');
const fastify = require('fastify');
const { test, beforeEach, afterEach } = require('tap');
const EikService = require('@eik/service');
const { sink } = require('@eik/core');
const cli = require('..');

beforeEach(async (t) => {
    const server = fastify({ logger: false });
    const memSink = new sink.MEM();
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen();

    const token = await cli.login({
        server: address,
        key: 'change_me',
    });

    t.context.server = server;
    t.context.address = address;
    t.context.token = token;
});

afterEach(async (t) => {
    await t.context.server.close();
});

test('package integrity', async (t) => {
    const { address, token } = t.context;

    await cli.publish({
        cwd: __dirname,
        server: address,
        name: 'my-app',
        token,
        version: '1.0.0',
        files: {
            'index.js': join(__dirname, './fixtures/client.js'),
            'index.css': join(__dirname, './fixtures/styles.css'),
        },
    });

    const result = await cli.integrity({
        server: address,
        name: 'my-app',
        version: '1.0.0',
        type: 'package',
    });

    t.equal(result.name, 'my-app');
    t.equal(result.version, '1.0.0');
    t.ok(result.integrity);
    t.equal(result.files[0].pathname, '/eik.json');
    t.ok(result.files[0].integrity);
    t.equal(result.files[1].pathname, '/index.js');
    t.ok(result.files[1].integrity);
    t.equal(result.files[2].pathname, '/index.css');
    t.ok(result.files[2].integrity);
});
