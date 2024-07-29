import fastify from 'fastify';
import { promises as fs } from 'fs';
import os from 'os';
import { join, basename } from 'path';
import { mockLogger } from './utils.mjs';
import { test, beforeEach, afterEach } from 'tap';
import EikService from '@eik/service';
import { sink } from '@eik/core';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cli from '../classes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

    t.context.server = server;
    t.context.address = address;
    t.context.token = token;
});

afterEach(async (t) => {
    await t.context.server.close();
});

test('package integrity', async (t) => {
    const { address, token } = t.context;

    await cli.publish({
        cwd: __dirname,
        server: address,
        name: 'my-app',
        token,
        version: '1.0.0',
        files: {
            'index.js': join(__dirname, './fixtures/client.js'),
            'index.css': join(__dirname, './fixtures/styles.css'),
        },
    });

    const result = await cli.integrity({
        server: address,
        name: 'my-app',
        version: '1.0.0',
        type: 'package',
    });

    t.equal(result.name, 'my-app');
    t.equal(result.version, '1.0.0');
    t.ok(result.integrity);
    t.equal(result.files[0].pathname, '/eik.json');
    t.ok(result.files[0].integrity);
    t.equal(result.files[1].pathname, '/index.js');
    t.ok(result.files[1].integrity);
    t.equal(result.files[2].pathname, '/index.css');
    t.ok(result.files[2].integrity);
});
