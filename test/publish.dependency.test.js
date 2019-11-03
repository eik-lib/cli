'use strict';

const { test } = require('tap');
const { sink } = require('@asset-pipe/core');
const Server = require('@asset-pipe/core/services/fastify');
const cli = require('../');
const { mockLogger } = require('./utils');

const memSink = new sink.MEM();
const server = new Server({ customSink: memSink, port: 4002 });

test('Packages PUT', async t => {
    await server.start();
    const l = mockLogger();

    const publishDep = new cli.publish.Dependency({
        logger: l.logger,
        server: `http://localhost:4002`,
        org: 'my-test-org',
        name: 'lit-html',
        version: '1.1.2'
    });

    const result = await publishDep.run();
    t.equals(result, true, 'Command should return true');
    t.match(
        l.logs.debug,
        'Running publish command',
        'Log output should match expectation'
    );
    t.match(
        l.logs.debug,
        'Org: my-test-org, Name: lit-html, Version: 1.1.2',
        'Log output should match expectation'
    );
    t.match(
        l.logs.debug,
        'Publish command complete',
        'Log output should match expectation'
    );

    await server.stop();
});
