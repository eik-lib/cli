/* eslint-disable no-param-reassign */

'use strict';

const fastify = require('fastify');
const { test, beforeEach, afterEach } = require('tap');
const EikService = require('@eik/service');
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
    
    t.context.server = server
    t.context.address = address;
    t.context.token = token;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.close();
    done();
});

test('Retrieving meta information about a package from an asset server', async t => {
    const { address, token } = t.context;
    const l = mockLogger();

    await new cli.publish.Dependency({
        server: address,
        name: 'lit-html',
        version: '1.1.2',
        token,
    }).run();

    const result = await new cli.Meta({
        logger: l.logger,
        server: address,
        name: 'lit-html',
        version: '1.1.2',
        debug: true,
        token,
    }).run();

    t.ok(result, 'Command should return truthy');
    t.match(result.name, 'lit-html', 'Log output should show package name');
    t.match(result.version, '1.1.2', 'Log output should show package version');
});
