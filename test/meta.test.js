'use strict';

const { test } = require('tap');
const { sink } = require('@eik/core');
const cli = require('../');
const { mockLogger, MockFastifyService } = require('./utils');

test('Retrieving meta information about a package from an asset server', async t => {
    const memSink = new sink.MEM();
    const server = new MockFastifyService({ customSink: memSink, port: 0 });
    await server.start();
    const { port } = server.app.server.address();
    const l = mockLogger();

    await new cli.publish.Dependency({
        server: `http://localhost:${port}`,
        org: 'my-test-org',
        name: 'lit-html',
        version: '1.1.2',
    }).run();

    const result = await new cli.Meta({
        logger: l.logger,
        server: `http://localhost:${port}`,
        org: 'my-test-org',
        name: 'lit-html',
        version: '1.1.2',
        debug: true,
    }).run();

    t.ok(result, 'Command should return truthy');
    t.match(result.name, 'lit-html', 'Log output should show package name');
    t.match(result.version, '1.1.2', 'Log output should show package version');
    t.match(result.org, 'my-test-org', 'Log output should show package org');

    await server.stop();
});
