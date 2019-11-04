'use strict';

const { test } = require('tap');
const { sink } = require('@asset-pipe/core');
const Server = require('@asset-pipe/core/services/fastify');
const cli = require('../');
const { mockLogger } = require('./utils');

const memSink = new sink.MEM();
const server = new Server({ customSink: memSink, port: 4002 });

test('Creating a package alias on an asset server', async t => {
    await server.start();
    const l = mockLogger();

    await new cli.publish.Dependency({
        server: `http://localhost:4002`,
        org: 'my-test-org',
        name: 'lit-html',
        version: '1.1.2'
    }).run();

    const result = await new cli.Alias({
        logger: l.logger,
        server: `http://localhost:4002`,
        org: 'my-test-org',
        type: 'pkg',
        name: 'lit-html',
        version: '1.1.2',
        alias: '1'
    }).run();

    t.equals(result, true, 'Command should return true');

    await server.stop();
});
