import fastify from 'fastify';
import { promises as fs } from 'fs';
import os from 'os';
import { exec as execCallback } from 'child_process';
import { join, basename } from 'path';
import { test, beforeEach, afterEach } from 'tap';
import EikService from '@eik/service';
import Sink from '@eik/sink-memory';
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

    t.context.server = server;
    t.context.address = address;
    t.context.folder = folder;
});

afterEach(async (t) => {
    await t.context.server.close();
});

test('eik login --key --server --cwd : valid key', async (t) => {
    const eik = join(__dirname, '..', '../index.js');
    const cmd = `node ${eik} login --key change_me --server ${t.context.address} --cwd ${t.context.folder}`;

    const { stdout } = await exec(cmd);

    t.match(stdout, 'Login successful');
    t.end();
});

test('eik login --key --server --cwd : invalid key', async (t) => {
    const eik = join(__dirname, '..', '..', 'index.js');
    const cmd = `node ${eik} login --key invalid --server ${t.context.address} --cwd ${t.context.folder}`;

    const { stdout } = await exec(cmd);
    t.match(stdout, 'Login unsuccessful');
    t.end();
});
