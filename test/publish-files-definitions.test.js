/* eslint-disable no-param-reassign */

const os = require('os');
const fs = require('fs').promises;
const { join, basename } = require('path');
const { test, beforeEach, afterEach } = require('tap');
const fastify = require('fastify');
const EikService = require('@eik/service');
const { sink } = require('@eik/core');
const { copySync } = require('fs-extra');
const cli = require('../classes');

const config = (files, server, token, cwd) => ({
    logger: null,
    cwd,
    server,
    name: 'my-app',
    files,
    debug: true,
    token,
    version: '1.0.0',
});

beforeEach(async (t) => {
    const memSink = new sink.MEM();
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
    copySync(join(__dirname, './fixtures'), join(cwd, 'fixtures'));

    t.context.server = server;
    t.context.address = address;
    t.context.token = token;
    t.context.cwd = cwd;
});

afterEach(async (t) => {
    await t.context.server.close();
});

test('when a folder of files is specified as a string', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = 'fixtures/icons';
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    t.equal(
        files[0].pathname,
        '/eik.json',
        'eik.json file should be at package root',
    );
    t.equal(
        files[1].pathname,
        '/checkbox-sprite-nontouch.svg',
        'files should be packaged at package root',
    );
});

test('when a folder of files is specified as a string prefixed by ./', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = './fixtures/icons';
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    t.equal(
        files[1].pathname,
        '/checkbox-sprite-nontouch.svg',
        'files should be packaged at package root',
    );
});

test('when a folder of files is specified as a string postfixed by /', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = './fixtures/icons/';
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    t.equal(
        files[1].pathname,
        '/checkbox-sprite-nontouch.svg',
        'files should be packaged at package root',
    );
});

test('when a folder of files is specified with a nested folder mapping', async (t) => {
    const { address, token, cwd } = t.context;
    const patter = { 'path/to/folder': './fixtures/icons/' };
    const { files } = await cli.publish(config(patter, address, token, cwd));

    t.equal(
        files[1].pathname,
        '/path/to/folder/checkbox-sprite-nontouch.svg',
        'files should be packaged at path/to/folder',
    );
});

test('when a folder of files is specified with a nested folder mapping prefixed by ./', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = { './path/to/folder': './fixtures/icons/' };
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    t.equal(
        files[1].pathname,
        '/path/to/folder/checkbox-sprite-nontouch.svg',
        'files should be packaged at path/to/folder',
    );
});

test('when a folder of files is specified with a nested folder mapping prefixed by /', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = { '/path/to/folder': './fixtures/icons/' };
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    t.equal(
        files[1].pathname,
        '/path/to/folder/checkbox-sprite-nontouch.svg',
        'files should be packaged at path/to/folder',
    );
});

test('when a folder of files is specified with a nested folder mapping post fixed with /', async (t) => {
    const { address, token, cwd } = t.context;
    const patter = { 'path/to/folder/': './fixtures/icons/' };
    const { files } = await cli.publish(config(patter, address, token, cwd));

    t.equal(
        files[1].pathname,
        '/path/to/folder/checkbox-sprite-nontouch.svg',
        'files should be packaged at path/to/folder',
    );
});

test('when a folder of files is specified as an absolute path string', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = join(__dirname, './fixtures/icons');
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    t.equal(
        files[0].pathname,
        '/eik.json',
        'eik.json file should be at package root',
    );
    t.equal(
        files[1].pathname,
        '/checkbox-sprite-nontouch.svg',
        'files should be packaged at package root',
    );
});

test('when a folder of files is specified as an object', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = {
        '/icons': './fixtures/icons',
    };
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    t.equal(
        files[1].pathname,
        '/icons/checkbox-sprite-nontouch.svg',
        'files should be packaged under /icons',
    );
});

test('when a folder of files is specified as an object with absolute path', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = {
        '/icons': join(__dirname, './fixtures/icons'),
    };
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    t.equal(
        files[1].pathname,
        '/icons/checkbox-sprite-nontouch.svg',
        'files should be packaged under /icons',
    );
});

test('when 2 specific file name entries are specified', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = {
        '/esm.js': './fixtures/client.js',
        '/esm.css': './fixtures/styles.css',
    };
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    t.equal(
        files[1].pathname,
        '/esm.js',
        'client.js should be mapped to esm.js',
    );
    t.equal(
        files[2].pathname,
        '/esm.css',
        'styles.js should be mapped to esm.css',
    );
});

test('when 2 specific file name entries are specified with absolute paths', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = {
        '/esm.js': join(__dirname, './fixtures/client.js'),
        '/esm.css': join(__dirname, './fixtures/styles.css'),
    };
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    t.equal(
        files[1].pathname,
        '/esm.js',
        'client.js should be mapped to esm.js',
    );
    t.equal(
        files[2].pathname,
        '/esm.css',
        'styles.js should be mapped to esm.css',
    );
});

test('when a recursive glob is specified', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = 'fixtures/**/*';
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    t.equal(
        files[2].pathname,
        '/client.js',
        'client.js should be packaged at /',
    );
    t.equal(
        files[3].pathname,
        '/icons/checkbox-sprite-nontouch.svg',
        'svgs should be packaged under /icons',
    );
});

test('when a non recursive glob is specified', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = 'fixtures/*';
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    const nested = files.filter((file) => file.pathname.includes('icons'));

    t.equal(
        files[2].pathname,
        '/client.js',
        'client.js should be packaged at /',
    );
    t.equal(nested.length, 0, 'no nested files should be present');
});

test('when a file is specified with a leading path', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = 'fixtures/client.js';
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    t.equal(
        files[1].pathname,
        '/client.js',
        'the file should be packaged at /',
    );
});

test('when a file is specified as an object and mapped with a leading path', async (t) => {
    const { address, token, cwd } = t.context;
    const pattern = { 'path/to/esm.js': 'fixtures/client.js' };
    const { files } = await cli.publish(config(pattern, address, token, cwd));

    t.equal(
        files[1].pathname,
        '/path/to/esm.js',
        'the file should be packaged with the leading path and the mapping',
    );
});
