import fastify from 'fastify';
import { promises as fs } from 'fs';
import os from 'os';
import { exec as execCallback } from 'child_process';
import { join, basename } from 'path';
import { test, beforeEach, afterEach } from 'tap';
import fetch from 'node-fetch';
import EikService from '@eik/service';
import { sink } from '@eik/core';
import cli from '../../classes/index.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function exec(cmd) {
    return new Promise((resolve) => {
        execCallback(cmd, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr });
        });
    });
}

beforeEach(async (t) => {
    const memSink = new sink.MEM();
    const server = fastify({ logger: false });
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen({
        host: '127.0.0.1',
        port: 0,
    });
    const folder = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));

    const token = await cli.login({
        server: address,
        key: 'change_me',
    });

    t.context.server = server;
    t.context.address = address;
    t.context.folder = folder;
    t.context.token = token;
});

afterEach(async (t) => {
    await t.context.server.close();
});

test('eik map : publish, details provided by eik.json file', async (t) => {
    const assets = {
        name: 'scroll-into-view-if-needed',
        version: '2.2.24',
        server: t.context.address,
        files: {
            'index.js': join(__dirname, './../fixtures/client.js'),
            'index.css': join(__dirname, './../fixtures/styles.css'),
        },
    };
    await fs.writeFile(
        join(t.context.folder, 'eik.json'),
        JSON.stringify(assets),
    );

    const map = {
        imports: {
            'scroll-into-view-if-needed': new URL(
                '/npm/scroll-into-view-if-needed/2.2.24/index.js',
                t.context.address,
            ).href,
        },
    };
    await fs.writeFile(
        join(t.context.folder, 'import-map.json'),
        JSON.stringify(map),
    );

    const eik = join(__dirname, '../../index.js');
    const cmd = `${eik} map test-map 1.0.0 import-map.json --token ${t.context.token} --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(new URL('/map/test-map/1.0.0', t.context.address));
    const result = await res.json();

    t.equal(res.ok, true);
    t.same(result, map);
    t.notOk(error);
    t.match(stdout, 'Published import map "test-map" at version "1.0.0"');
    t.end();
});
