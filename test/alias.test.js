'use strict';

const { test } = require('tap');
const { sink } = require('@eik/core');
const cli = require('../');
const { mockLogger, MockFastifyService } = require('./utils');

test('Creating a package alias on an asset server', async t => {
    const l = mockLogger();
    const memSink = new sink.MEM();
    const server = new MockFastifyService({ customSink: memSink, port: 0 });
    await server.start();
    const { port } = server.app.server.address();

    await new cli.publish.Dependency({
        server: `http://localhost:${port}`,
        org: 'my-test-org',
        name: 'lit-html',
        version: '1.1.2',
        debug: true,
    }).run();

    const result = await new cli.Alias({
        logger: l.logger,
        server: `http://localhost:${port}`,
        org: 'my-test-org',
        type: 'pkg',
        name: 'lit-html',
        version: '1.1.2',
        alias: '1',
        debug: true,
    }).run();

    t.equals(result, true, 'Command should return true');

    await server.stop();
});

test('Creating a map alias on an asset server', async t => {
    const l = mockLogger();
    const memSink = new sink.MEM();
    const server = new MockFastifyService({ customSink: memSink, port: 0 });
    await server.start();
    const { port } = server.app.server.address();

    await new cli.publish.Map({
        cwd: __dirname,
        server: `http://localhost:${port}`,
        org: 'my-test-org',
        name: 'my-map',
        version: '1.0.0',
        file: './fixtures/import-map.json',
        debug: true,
    }).run();

    const result = await new cli.Alias({
        logger: l.logger,
        server: `http://localhost:${port}`,
        org: 'my-test-org',
        type: 'map',
        name: 'my-map',
        version: '1.0.0',
        alias: '1',
        debug: true,
    }).run();

    t.equals(result, true, 'Command should return true');

    await server.stop();
});
