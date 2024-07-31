import { promises as fs } from 'fs';
import os from 'os';
import { test } from 'tap';
import { join, basename } from 'path';
import { readFileSync } from 'fs';
import { exec as execCallback } from 'node:child_process';
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

test('Initializing a new eik.json file', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const folder = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
    const publishCmd = `${eik} init --cwd ${folder}`;
    const res = await exec(publishCmd);
    const assets = JSON.parse(
        readFileSync(join(folder, 'eik.json'), { encoding: 'utf8' }),
    );
    t.equal(assets.name, '', 'eik.json "name" field should be empty');
    t.equal(
        assets.version,
        '1.0.0',
        'eik.json "version" field should equal 1.0.0',
    );
    t.equal(assets.server, '', 'eik.json "server" field should be empty');
    t.same(assets.files, {}, 'eik.json "files" should be an empty object');
});

test('Initializing a new eik.json file passing custom values', async (t) => {
    const eik = join(__dirname, '../../index.js');
    const folder = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));

    const publishCmd = `${eik} init 
        --cwd ${folder}
        --name custom-name
        --version 2.0.0
        --server http://localhost:4001`;
    await exec(publishCmd.split('\n').join(' '));

    const assets = JSON.parse(
        readFileSync(join(folder, 'eik.json'), { encoding: 'utf8' }),
    );

    t.equal(
        assets.name,
        'custom-name',
        'eik.json "name" field should not be empty',
    );
    t.equal(
        assets.version,
        '2.0.0',
        'eik.json "version" field should not be empty',
    );
    t.equal(
        assets.server,
        'http://localhost:4001',
        'eik.json "server" field should not be empty',
    );
    t.same(assets.files, {}, 'eik.json "js.input" field should not be empty');
});
