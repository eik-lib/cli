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

test('Uploading a dependency to an asset server', async t => {
    const { address, token } = t.context;
    const l = mockLogger();

    const publishDep = new cli.publish.Dependency({
        logger: l.logger,
        server: address,
        name: 'lit-html',
        version: '1.1.2',
        debug: true,
        token,
    });

    const result = await publishDep.run();

    t.equals(result, true, 'Command should return true');
    t.match(
        l.logs.debug,
        ':: npm lit-html v1.1.2',
        'Log output should show published name and version',
    );
    t.match(
        l.logs.info,
        'Published dependency package "lit-html" at version "1.1.2"',
        'Log output should command completion',
    );
});

test('Uploading a dependency with @ character in name', async t => {
    const { address, token } = t.context;
    const l = mockLogger();

    const publishDep = new cli.publish.Dependency({
        logger: l.logger,
        server: address,
        name: '@podium/browser',
        version: '1.0.0-beta.2',
        debug: true,
        token,
    });

    const result = await publishDep.run();

    t.equals(result, true, 'Command should return true');
    t.match(
        l.logs.debug,
        ':: npm @podium/browser v1.0.0-beta.2',
        'Log output should show published name and version',
    );
    t.match(
        l.logs.info,
        'Published dependency package "@podium/browser" at version "1.0.0-beta.2"',
        'Log output should command completion',
    );
});
