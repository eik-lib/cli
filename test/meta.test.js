/* eslint-disable no-param-reassign */

'use strict';

const os = require('os');
const fs = require('fs').promises;
const { join, basename } = require('path');
const fastify = require('fastify');
const { test, beforeEach, afterEach } = require('tap');
const EikService = require('@eik/service');
const { EikConfig } = require('@eik/common');
const { sink } = require('@eik/core');
const { mockLogger } = require('./utils');
const cli = require('..');

function buildTestConfig(files) {
    return new EikConfig({files: files || {
        './index.js': './fixtures/client.js',
        './index.css': './fixtures/styles.css',
    }}, null, __dirname)
}

beforeEach(async (done, t) => {
    const server = fastify({ logger: false });
    const memSink = new sink.MEM();
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen();
    
    const login = new cli.Login({
        server: address,
        key: 'change_me',
    });
    const token = await login.run();
    
    const cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));

    t.context.server = server
    t.context.address = address;
    t.context.token = token;
    t.context.cwd = cwd;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.close();
    done();
});

test('Retrieving meta information about a package from an asset server', async t => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    await new cli.publish.Package({
        server: address,
        name: 'lit-html',
        version: '1.1.2',
        token,
        npm: true,
        cwd,
        config: buildTestConfig(),
    }).run();

    const result = await new cli.Meta({
        logger: l.logger,
        server: address,
        name: 'lit-html',
        debug: true,
        token,
        cwd,
    }).run();

    t.ok(result, 'Command should return truthy');
    t.ok(result.npm, 'Command should be npm scoped');
    t.equal(result.npm.name, 'lit-html', 'Log output should show package name');
    t.equal(result.npm.versions[0].version, '1.1.2', 'Log output should show package version');
});
