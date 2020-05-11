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

    const publishDep = new cli.publish.NPM({
        logger: l.logger,
        server: address,
        name: 'lit-html',
        version: '1.1.2',
        debug: true,
        token,
    });

    const result = await publishDep.run();

    t.equals(result.name, 'lit-html', 'Command should return name of package');
    t.equals(result.version, '1.1.2', 'Command should return version of package');
    t.match(l.logs.debug, 'Running publish command');
    t.notMatch(l.logs.debug, 'Dependency format: common js modules detected, conversion to esm will occur');
    t.match(l.logs.debug, 'Creating zip file');
    t.match(l.logs.debug, 'Uploading zip file to server');
});

test('Uploading a dependency with @ character in name', async t => {
    const { address, token } = t.context;
    const l = mockLogger();

    const publishDep = new cli.publish.NPM({
        logger: l.logger,
        server: address,
        name: '@podium/browser',
        version: '1.0.0-beta.2',
        debug: true,
        token,
    });

    const result = await publishDep.run();

    t.equals(result.name, '@podium/browser', 'Command should return version of package');
    t.equals(result.version, '1.0.0-beta.2', 'Command should return version of package');
    t.match(l.logs.debug, 'Running publish command');
    t.match(l.logs.debug, 'Dependency format: common js modules detected, conversion to esm will occur');
    t.match(l.logs.debug, 'Creating zip file');
    t.match(l.logs.debug, 'Uploading zip file to server');
});
