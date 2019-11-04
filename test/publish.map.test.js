'use strict';

const { test } = require('tap');
const { sink } = require('@asset-pipe/core');
const Server = require('@asset-pipe/core/services/fastify');
const cli = require('../');
const { mockLogger } = require('./utils');

test('Uploading import map to an asset server', async t => {
    const memSink = new sink.MEM();
    const server = new Server({ customSink: memSink, port: 0 });
    await server.start();
    const { port } = server.app.server.address();
    const l = mockLogger();

    const publishMap = new cli.publish.Map({
        logger: l.logger,
        cwd: __dirname,
        server: `http://localhost:${port}`,
        org: 'my-test-org',
        name: 'my-map',
        version: '1.0.0',
        file: './fixtures/import-map.json'
    });

    const result = await publishMap.run();
    t.equals(result, true, 'Command should return true');
    t.match(
        l.logs.debug,
        'Uploading import map "my-map" version "1.0.0" to asset server',
        'Log output should show published name, version and org'
    );
    t.match(
        l.logs.debug,
        'Import map publish command complete',
        'Log output should command completion'
    );

    await server.stop();
});
