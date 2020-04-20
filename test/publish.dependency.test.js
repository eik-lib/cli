/* eslint-disable no-param-reassign */

'use strict';

const { test, beforeEach, afterEach } = require('tap');
const AssetServer = require('@eik/service');
const { sink } = require('@eik/core');
const { mockLogger } = require('./utils');
const cli = require('..');

beforeEach(async (done, t) => {
    const memSink = new sink.MEM();
    const server = new AssetServer({ customSink: memSink });
    const address = await server.start();
    
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
    await t.context.server.stop();
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
        ':: pkg lit-html v1.1.2',
        'Log output should show published name and version',
    );
    t.match(
        l.logs.info,
        'Published dependency package "lit-html" at version "1.1.2"',
        'Log output should command completion',
    );
});
