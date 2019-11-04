'use strict';

const { test } = require('tap');
const { sink } = require('@asset-pipe/core');
const Server = require('@asset-pipe/core/services/fastify');
const cli = require('../');
const { mockLogger } = require('./utils');

const memSink = new sink.MEM();
const server = new Server({ customSink: memSink, port: 4003 });

test('Uploading app assets to an asset server', async t => {
    await server.start();
    const l = mockLogger();

    const publishApp = new cli.publish.App({
        logger: l.logger,
        cwd: __dirname,
        server: `http://localhost:4003`,
        org: 'my-test-org',
        name: 'my-app',
        version: '1.0.0',
        js: './fixtures/client.js',
        css: './fixtures/styles.css'
    });

    const result = await publishApp.run();
    t.equals(result, true, 'Command should return true');
    t.match(
        l.logs.debug,
        'Org: my-test-org, Name: my-app, Version: 1.0.0',
        'Log output should show published name, version and org'
    );
    t.match(
        l.logs.debug,
        'Publish command complete',
        'Log output should command completion'
    );

    await server.stop();
});
