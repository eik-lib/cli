/* eslint-disable no-param-reassign */

'use strict';

const fastify = require('fastify');
const { test, beforeEach, afterEach } = require('tap');
const EikService = require('@eik/service');
const { EikConfig } = require('@eik/common');
const { sink } = require('@eik/core');
const cli = require('..');

function buildTestConfig(files) {
    return new EikConfig({files: files || {
        './index.js': './fixtures/client.js',
        './index.css': './fixtures/styles.css',
    }}, null, __dirname)
}

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

    await new cli.publish.Package({
        cwd: __dirname,
        server: address,
        name: 'my-app',
        config: buildTestConfig(),
        token,
        version: '1.0.0',
    }).run();

    const result = await new cli.Integrity({
        server: address,
        name: 'my-app',
        version: '1.0.0',
    }).run();

    t.equal(result.name, 'my-app');
    t.equal(result.version, '1.0.0');
    t.ok(result.integrity);
    t.same(Object.keys(result.files), [
        '/eik.json',
        '/index.js',
        '/index.css'
    ]);
});
