/* eslint-disable no-param-reassign */

'use strict';

const fs = require('fs').promises;
const { join } = require('path');
const { test, beforeEach, afterEach } = require('tap');
const rimraf = require('rimraf');
const CleanupTask = require('../../classes/publish/package/tasks/cleanup');

beforeEach(async (t) => {
    const path = join(__dirname, '.eik');
    await fs.mkdir(path);
    await fs.copyFile(
        join(__dirname, '../fixtures/client.js'),
        join(__dirname, './.eik/client.js'),
    );
    await fs.copyFile(
        join(__dirname, '../fixtures/styles.css'),
        join(__dirname, './.eik/styles.css'),
    );
    await fs.copyFile(
        join(__dirname, '../fixtures/integrity.json'),
        join(__dirname, './.eik/integrity.json'),
    );
    t.context.path = path;
});

afterEach((t) => {
    rimraf.sync(t.context.path);
});

test('basic cleanup', async (t) => {
    const cleanup = new CleanupTask({ path: t.context.path });
    await cleanup.process();

    const files = await fs.readdir(t.context.path);
    t.equal(files.length, 1);
    t.equal(files[0], 'integrity.json');
});
