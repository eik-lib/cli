import fastify from 'fastify';
import { promises as fs } from 'fs';
import os from 'os';
import { join, basename } from 'path';
import { mockLogger } from './utils.mjs';
import { test, beforeEach, afterEach } from 'tap';
import EikService from '@eik/service';
import Sink from '@eik/sink-memory';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cli from '../classes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

beforeEach(async (t) => {
    const memSink = new Sink();
    const server = fastify({ logger: false });
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

test('Uploading app assets to an asset server', async (t) => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    const result = await cli.publish({
        logger: l.logger,
        cwd,
        server: address,
        name: 'my-app',
        debug: true,
        token,
        version: '1.0.0',
        files: {
            'index.js': join(__dirname, './fixtures/client.js'),
            'index.css': join(__dirname, './fixtures/styles.css'),
        },
    });

    t.equal(result.type, 'pkg', 'Command should return correct type');
    t.equal(result.name, 'my-app', 'Command should return correct name');
    t.equal(result.version, '1.0.0', 'Command should return correct version');
    t.equal(result.files.length, 3, 'Command should return files array');
    t.match(l.logs.debug, 'Running package command');
    t.match(l.logs.debug, 'Uploading zip file to server');
    t.match(l.logs.debug, 'Cleaning up');
});

test('Uploading app assets to an asset server under npm namespace', async (t) => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    const result = await cli.publish({
        logger: l.logger,
        cwd,
        server: address,
        name: 'my-app',
        files: {
            'index.js': join(__dirname, './fixtures/client.js'),
            'index.css': join(__dirname, './fixtures/styles.css'),
        },
        type: 'npm',
        debug: true,
        token,
        version: '1.0.0',
    });

    t.equal(result.type, 'npm', 'Command should return correct type');
    t.equal(result.name, 'my-app', 'Command should return correct name');
    t.equal(result.version, '1.0.0', 'Command should return correct version');
    t.equal(result.files.length, 3, 'Command should return files array');
    t.match(l.logs.debug, 'Running package command');
    t.match(l.logs.debug, 'Uploading zip file to server');
    t.match(l.logs.debug, 'Cleaning up');
});

test('Uploading app assets to an asset server under image namespace', async (t) => {
	const { address, token, cwd } = t.context;
	const l = mockLogger();

	const result = await cli.publish({
			logger: l.logger,
			cwd,
			server: address,
			name: 'my-app',
			debug: true,
			type: 'image',
			token,
			version: '1.0.0',
			files: {
					'index.js': join(__dirname, './fixtures/client.js'),
					'index.css': join(__dirname, './fixtures/styles.css'),
			},
	});

	t.equal(result.type, 'img', 'Command should return correct type');
	t.equal(result.name, 'my-app', 'Command should return correct name');
	t.equal(result.version, '1.0.0', 'Command should return correct version');
	t.equal(result.files.length, 3, 'Command should return files array');
	t.match(l.logs.debug, 'Running package command');
	t.match(l.logs.debug, 'Uploading zip file to server');
	t.match(l.logs.debug, 'Cleaning up');
});

test('Uploading JS app assets only to an asset server', async (t) => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    const result = await cli.publish({
        logger: l.logger,
        cwd,
        server: address,
        name: 'my-app',
        files: {
            'index.js': join(__dirname, './fixtures/client.js'),
        },
        debug: true,
        token,
        version: '1.0.0',
    });

    t.equal(result.type, 'pkg', 'Command should return correct type');
    t.equal(result.name, 'my-app', 'Command should return correct name');
    t.equal(result.version, '1.0.0', 'Command should return correct version');
    t.equal(result.files.length, 2, 'Command should return files array');
    t.match(l.logs.debug, 'Running package command');
    t.match(l.logs.debug, 'Uploading zip file to server');
    t.match(l.logs.debug, 'Cleaning up');
});

test('Uploading CSS app assets only to an asset server', async (t) => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    const result = await cli.publish({
        logger: l.logger,
        cwd,
        server: address,
        name: 'my-app',
        files: {
            'index.css': join(__dirname, './fixtures/styles.css'),
        },
        debug: true,
        token,
        version: '1.0.0',
    });

    t.equal(result.type, 'pkg', 'Command should return correct type');
    t.equal(result.name, 'my-app', 'Command should return correct name');
    t.equal(result.version, '1.0.0', 'Command should return correct version');
    t.equal(result.files.length, 2, 'Command should return files array');
    t.match(l.logs.debug, 'Running package command');
    t.match(l.logs.debug, 'Uploading zip file to server');
    t.match(l.logs.debug, 'Cleaning up');
});

test('Uploading a directory of assets to an asset server', async (t) => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    const result = await cli.publish({
        logger: l.logger,
        cwd,
        server: address,
        name: 'my-app',
        files: {
            icons: join(__dirname, './fixtures/icons/**/*'),
        },
        debug: true,
        token,
        version: '1.0.0',
    });

    t.equal(result.type, 'pkg', 'Command should return correct type');
    t.equal(result.name, 'my-app', 'Command should return correct name');
    t.equal(result.version, '1.0.0', 'Command should return correct version');
    t.equal(result.files.length, 7, 'Command should return files array');
    t.match(l.logs.debug, 'Running package command');
    t.match(l.logs.debug, 'Uploading zip file to server');
    t.match(l.logs.debug, 'Cleaning up');
});

test('Uploading a directory of assets to the root path to an asset server 2', async (t) => {
    const { address, token, cwd } = t.context;
    const l = mockLogger();

    const result = await cli.publish({
        logger: l.logger,
        cwd,
        server: address,
        name: 'my-app',
        files: join(__dirname, './fixtures/icons/**/*'),
        debug: true,
        token,
        version: '1.0.0',
    });

    t.equal(result.type, 'pkg', 'Command should return correct type');
    t.equal(result.name, 'my-app', 'Command should return correct name');
    t.equal(result.version, '1.0.0', 'Command should return correct version');
    t.equal(result.files.length, 7, 'Command should return files array');
    t.match(l.logs.debug, 'Running package command');
    t.match(l.logs.debug, 'Uploading zip file to server');
    t.match(l.logs.debug, 'Cleaning up');
});
