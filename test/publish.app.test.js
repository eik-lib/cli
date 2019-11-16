'use strict';

const { test } = require('tap');
const { sink } = require('@eik/core');
const Server = require('@eik/core/services/fastify');
const cli = require('../');
const { mockLogger } = require('./utils');

test('Uploading app assets to an asset server', async t => {
    const memSink = new sink.MEM();
    const server = new Server({ customSink: memSink, port: 0 });
    await server.start();
    const { port } = server.app.server.address();
    const l = mockLogger();

    const publishApp = new cli.publish.App({
        logger: l.logger,
        cwd: __dirname,
        server: `http://localhost:${port}`,
        org: 'my-test-org',
        name: 'my-app',
        version: '1.0.0',
        js: './fixtures/client.js',
        css: './fixtures/styles.css',
        debug: true,
    });

    const result = await publishApp.run();
    t.equals(result, true, 'Command should return true');
    t.match(
        l.logs.debug,
        'Org: my-test-org, Name: my-app, Version: 1.0.0',
        'Log output should show published name, version and org',
    );
    t.match(
        l.logs.info,
        'Published app package "my-app" at version "1.0.0"',
        'Log output should command completion',
    );

    await server.stop();
});

test('Uploading JS app assets only to an asset server', async t => {
    const memSink = new sink.MEM();
    const server = new Server({ customSink: memSink, port: 0 });
    await server.start();
    const { port } = server.app.server.address();
    const l = mockLogger();

    const publishApp = new cli.publish.App({
        logger: l.logger,
        cwd: __dirname,
        server: `http://localhost:${port}`,
        org: 'my-test-org',
        name: 'my-app',
        version: '1.0.0',
        js: './fixtures/client.js',
        debug: true,
    });

    const result = await publishApp.run();
    t.equals(result, true, 'Command should return true');
    t.match(
        l.logs.debug,
        'CSS entrypoint not defined, skipping CSS bundling',
        'Log output should show that CSS bundling was skipped',
    );
    t.match(
        l.logs.info,
        'Published app package "my-app" at version "1.0.0"',
        'Log output should command completion',
    );

    await server.stop();
});

test('Uploading CSS app assets only to an asset server', async t => {
    const memSink = new sink.MEM();
    const server = new Server({ customSink: memSink, port: 0 });
    await server.start();
    const { port } = server.app.server.address();
    const l = mockLogger();

    const publishApp = new cli.publish.App({
        logger: l.logger,
        cwd: __dirname,
        server: `http://localhost:${port}`,
        org: 'my-test-org',
        name: 'my-app',
        version: '1.0.0',
        css: './fixtures/styles.css',
        debug: true,
    });

    const result = await publishApp.run();
    t.equals(result, true, 'Command should return true');
    t.match(
        l.logs.debug,
        'JavaScript entrypoint not defined, skipping JS bundling',
        'Log output should show that JS bundling was skipped',
    );
    t.match(
        l.logs.info,
        'Published app package "my-app" at version "1.0.0"',
        'Log output should command completion',
    );

    await server.stop();
});
