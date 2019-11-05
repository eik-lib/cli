'use strict';

const { test } = require('tap');
const { sink } = require('@asset-pipe/core');
const Server = require('@asset-pipe/core/services/fastify');
const cli = require('../');
const { mockLogger } = require('./utils');

test('Uploading a dependency to an asset server', async t => {
    const memSink = new sink.MEM();
    const server = new Server({ customSink: memSink, port: 0 });
    await server.start();
    const { port } = server.app.server.address();
    const l = mockLogger();

    const publishDep = new cli.publish.Dependency({
        logger: l.logger,
        server: `http://localhost:${port}`,
        org: 'my-test-org',
        name: 'lit-html',
        version: '1.1.2',
    });

    const result = await publishDep.run();

    t.equals(result, true, 'Command should return true');
    t.match(
        l.logs.debug,
        'Org: my-test-org, Name: lit-html, Version: 1.1.2',
        'Log output should show published name, version and org',
    );
    t.match(
        l.logs.debug,
        'Publish command complete',
        'Log output should command completion',
    );

    await server.stop();
});
