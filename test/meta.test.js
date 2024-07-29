/* eslint-disable no-param-reassign */

'use strict';

const os = require('os');
const fs = require('fs').promises;
const { join, basename } = require('path');
const fastify = require('fastify');
const { test, beforeEach, afterEach } = require('tap');
const EikService = require('@eik/service');
const { sink } = require('@eik/core');
const { mockLogger } = require('./utils');
const cli = require('..');

beforeEach(async (t) => {
    const server = fastify({ logger: false });
    const memSink = new sink.MEM();
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen({
        host: '127.0.0.1',
        port: 0,
    });

    const token = await cli.login({
        server: address,
        key: 'change_me',
    });

    const cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));

    t.context.server = server;
    t.context.address = address;
    t.context.token = token;
    t.context.cwd = cwd;
});

afterEach(async (t) => {
    await t.context.server.close();
});

test('Retrieving meta information about a package from an asset server', async (t) => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    await cli.publish({
        server: address,
        name: 'lit-html',
        version: '1.1.2',
        token,
        type: 'npm',
        cwd,
        files: {
            'index.js': join(__dirname, './fixtures/client.js'),
            'index.css': join(__dirname, './fixtures/styles.css'),
        },
    });

    const result = await cli.meta({
        logger: l.logger,
        server: address,
        name: 'lit-html',
        debug: true,
        token,
        cwd,
    });

    t.ok(result, 'Command should return truthy');
    t.ok(result.npm, 'Command should be npm scoped');
    t.equal(result.npm.name, 'lit-html', 'Log output should show package name');
    t.equal(
        result.npm.versions[0].version,
        '1.1.2',
        'Log output should show package version',
    );
});
