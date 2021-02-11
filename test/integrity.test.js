/* eslint-disable no-param-reassign */

'use strict';

const { join } = require('path');
const fastify = require('fastify');
const { test, beforeEach, afterEach } = require('tap');
const EikService = require('@eik/service');
const { sink } = require('@eik/core');
const cli = require('..');

beforeEach(async (done, t) => {
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
    done();
});

afterEach(async (done, t) => {
    await t.context.server.close();
    done();
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
            './index.js': join(__dirname, './fixtures/client.js'),
            './index.css': join(__dirname, './fixtures/styles.css'),
        }
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
    t.same(Object.keys(result.files), [
        '/eik.json',
        '/index.js',
        '/index.css'
    ]);
});
