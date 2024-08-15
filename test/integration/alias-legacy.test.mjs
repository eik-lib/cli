import fastify from 'fastify';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import { exec as execCallback } from 'child_process';
import { join, basename } from 'node:path';
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
    const server = fastify({ logger: false });
    const memSink = new Sink();
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen({
        host: '127.0.0.1',
        port: 0,
    });
    const folder = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
    const eik = join(__dirname, '../../index.js');

    const token = await cli.login({
        server: address,
        key: 'change_me',
    });

    const assets = {
        name: 'scroll-into-view-if-needed',
        version: '2.2.24',
        type: 'npm',
        server: address,
        files: {
            'index.js': join(__dirname, './../fixtures/client.js'),
            'index.css': join(__dirname, './../fixtures/styles.css'),
        },
    };

    await fs.writeFile(join(folder, 'eik.json'), JSON.stringify(assets));

    const cmd = `node ${eik} package --token ${token} --cwd ${folder}`;
    await exec(cmd);

    const map = {
        imports: {
            'scroll-into-view-if-needed': new URL(
                '/npm/scroll-into-view-if-needed/2.2.24/index.js',
                address,
            ).href,
        },
    };
    await fs.writeFile(join(folder, 'import-map.json'), JSON.stringify(map));
    const mapCmd = `node ${eik} map test-map 1.0.0 import-map.json
        --token ${token}
        --server ${address}
        --cwd ${folder}`;
    await exec(mapCmd.split('\n').join(' '));

    t.context.server = server;
    t.context.address = address;
    t.context.folder = folder;
    t.context.token = token;
});

afterEach(async (t) => {
    await t.context.server.close();
});

test('eik package-alias <name> <version> <alias>', async (t) => {
    const { address, token, folder: cwd } = t.context;
    const eik = join(__dirname, '../../index.js');

    const assets = {
        server: address,
        name: 'my-pack',
        version: '1.0.0',
        files: {
            'index.js': join(__dirname, '../fixtures/client.js'),
            'index.css': join(__dirname, '../fixtures/styles.css'),
        },
    };

    await fs.writeFile(join(cwd, 'eik.json'), JSON.stringify(assets));

    const cmd1 = `node ${eik} package --token ${token} --cwd ${cwd}`;
    await exec(cmd1);

    const cmd2 = `node ${eik} package-alias my-pack 1.0.0 1
        --token ${token}
        --server ${address}
        --cwd ${cwd}`;

    const { error, stdout } = await exec(cmd2.split('\n').join(' '));

    const res = await fetch(new URL('/pkg/my-pack/v1/index.js', address));

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'PACKAGE');
    t.match(stdout, 'my-pack');
    t.match(stdout, '1.0.0');
    t.match(stdout, 'v1');
    t.match(stdout, 'NEW');
});

test('eik npm-alias <name> <version> <alias> --token --server : no eik.json or .eikrc', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `node ${eik} npm-alias scroll-into-view-if-needed 2.2.24 2
        --token ${t.context.token}
        --server ${t.context.address}
        --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd.split('\n').join(' '));

    const res = await fetch(
        new URL(
            '/npm/scroll-into-view-if-needed/v2/index.js',
            t.context.address,
        ),
    );

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'NPM');
    t.match(stdout, 'scroll-into-view-if-needed');
    t.match(stdout, '2.2.24');
    t.match(stdout, 'v2');
    t.match(stdout, 'NEW');
    t.end();
});

test('eik npm-alias <name> <version> <alias> : publish details provided by eik.json file', async (t) => {
    const assets = {
        name: 'test-app',
        version: '1.0.0',
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
    const eik = join(__dirname, '../../index.js');
    const cmd = `node ${eik} npm-alias scroll-into-view-if-needed 2.2.24 2 --token ${t.context.token} --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(
        new URL(
            '/npm/scroll-into-view-if-needed/v2/index.js',
            t.context.address,
        ),
    );

    t.equal(res.ok, true);
    t.notOk(error);
    t.match(stdout, 'NPM');
    t.match(stdout, 'scroll-into-view-if-needed');
    t.match(stdout, '2.2.24');
    t.match(stdout, 'v2');
    t.match(stdout, 'NEW');
    t.end();
});

test('eik map-alias <name> <version> <alias> --token --server : no eik.json or .eikrc', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const cmd = `node ${eik} map-alias test-map 1.0.0 1
        --token ${t.context.token}
        --server ${t.context.address}
        --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd.split('\n').join(' '));

    const res = await fetch(new URL('/map/test-map/v1', t.context.address));

    t.equal(res.ok, true);

    t.notOk(error);
    t.match(stdout, 'MAP');
    t.match(stdout, 'test-map');
    t.match(stdout, '1.0.0');
    t.match(stdout, 'v1');
    t.match(stdout, 'NEW');
    t.end();
});

test('eik map-alias <name> <version> <alias> : publish details provided by eik.json file', async (t) => {
    const assets = {
        name: 'test-app',
        version: '1.0.0',
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
    const eik = join(__dirname, '../../index.js');
    const cmd = `node ${eik} map-alias test-map 1.0.0 1 --token ${t.context.token} --cwd ${t.context.folder}`;

    const { error, stdout } = await exec(cmd);

    const res = await fetch(new URL('/map/test-map/v1', t.context.address));

    t.equal(res.ok, true);

    t.notOk(error);
    t.match(stdout, 'MAP');
    t.match(stdout, 'test-map');
    t.match(stdout, '1.0.0');
    t.match(stdout, 'v1');
    t.match(stdout, 'NEW');
    t.end();
});
