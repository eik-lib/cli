import fastify from 'fastify';
import { promises as fs } from 'fs';
import os from 'os';
import { exec as execCallback } from 'child_process';
import { join, basename } from 'path';
import { test, beforeEach, afterEach } from 'tap';
import EikService from '@eik/service';
import Sink from '@eik/sink-memory';
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
    const memSink = new Sink();
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

test('eik meta : details provided by eik.json', async (t) => {
    const assets = {
        name: 'test-app',
        version: '1.0.0',
        server: t.context.address,
        files: {
            'index.js': join(__dirname, '..', 'fixtures/client.js'),
            'index.css': join(__dirname, '../fixtures/styles.css'),
        },
    };
    await fs.writeFile(
        join(t.context.folder, 'eik.json'),
        JSON.stringify(assets),
    );

    const eik = join(__dirname, '..', '..', 'index.js');

    let cmd = `node ${eik} package --token ${t.context.token} --cwd ${t.context.folder}`;
    await exec(cmd);

    cmd = `node ${eik} integrity --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const integrity = JSON.parse(
        await fs.readFile(
            join(t.context.folder, '.eik', 'integrity.json'),
            'utf8',
        ),
    );

    t.notOk(error);
    t.match(
        stdout,
        'integrity information for package "test-app" (v1.0.0) saved to ".eik/integrity.json"',
    );
    t.equal(integrity.name, 'test-app');
    t.equal(integrity.version, '1.0.0');
    t.ok(integrity.integrity);
    t.end();
});

test('eik meta : details provided by eik.json - npm namespace', async (t) => {
    const assets = {
        name: 'test-app-npm',
        version: '1.0.0',
        type: 'npm',
        server: t.context.address,
        files: {
            'index.js': join(__dirname, '..', 'fixtures', 'client.js'),
            'index.css': join(__dirname, '..', 'fixtures', 'styles.css'),
        },
    };
    await fs.writeFile(
        join(t.context.folder, 'eik.json'),
        JSON.stringify(assets),
    );

    const eik = join(__dirname, '..', '../index.js');

    let cmd = `node ${eik} package --token ${t.context.token} --cwd ${t.context.folder}`;
    await exec(cmd);

    cmd = `node ${eik} integrity --cwd ${t.context.folder}`;
    const { error, stdout } = await exec(cmd);

    const integrity = JSON.parse(
        await fs.readFile(
            join(t.context.folder, '.eik', 'integrity.json'),
            'utf8',
        ),
    );

    t.notOk(error);
    t.match(
        stdout,
        'integrity information for package "test-app-npm" (v1.0.0) saved to ".eik/integrity.json"',
    );
    t.equal(integrity.name, 'test-app-npm');
    t.equal(integrity.version, '1.0.0');
    t.ok(integrity.integrity);
    t.equal(integrity.files.length, 3);
    t.equal(integrity.files[0].pathname, '/eik.json');
    t.ok(integrity.files[0].integrity);
    t.end();
});
