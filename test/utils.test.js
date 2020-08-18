'use strict';

const fs = require('fs');
const crypto = require('crypto');
const { join } = require('path');
const { test } = require('tap');
const fastify = require('fastify');
const j = require('../utils/json');
const h = require('../utils/hash');
const f = require('../utils/http');
const entrypoints = require('../utils/entrypoints');

test('calculate file hash', async (t) => {
    const hash = await h.file(
        join(__dirname, 'fixtures', 'client.js'),
    );
    t.equal(
        hash,
        'sha512-7y37q0qk5mDqzHrGvJAR9J8kPX+orJhuO+KrCTKw11ZKRI/5udUuKt2Zb/thH5H39OQYrvnHTLbZS9ShG/lGCg==',
        'returned hash should match',
    );
});

test('calculate files hash', async (t) => {
    const hash = await h.files([
        join(__dirname, 'fixtures', 'styles.css'),
        join(__dirname, 'fixtures', 'client.js'),
        join(__dirname, 'fixtures', 'import-map.json'),
    ]);

    const fileHash1 = await h.file(
        join(__dirname, 'fixtures', 'client.js'),
    );
    const fileHash2 = await h.file(
        join(__dirname, 'fixtures', 'import-map.json'),
    );
    const fileHash3 = await h.file(
        join(__dirname, 'fixtures', 'styles.css'),
    );

    const hasher = crypto.createHash('sha512');
    hasher.update(fileHash1);
    hasher.update(fileHash2);
    hasher.update(fileHash3);

    t.equal(
        hash,
        `sha512-${hasher.digest('base64')}`,
        'returned hash should match',
    );
});

test('compare hashes - true', async (t) => {
    const fileHash1 = await h.file(
        join(__dirname, 'fixtures', 'client.js'),
    );
    const fileHash2 = await h.file(
        join(__dirname, 'fixtures', 'client.js'),
    );

    t.equal(
        h.compare(fileHash1, fileHash2),
        true,
        'hashes compared should produce a true result',
    );
});

test('compare hashes - false', async (t) => {
    const fileHash1 = await h.file(
        join(__dirname, 'fixtures', 'client.js'),
    );
    const fileHash2 = await h.file(
        join(__dirname, 'fixtures', 'import-map.json'),
    );

    t.equal(
        h.compare(fileHash1, fileHash2),
        false,
        'hashes compared should produce a false result',
    );
});

test('fetch latest version for a given published bundle', async (t) => {
    const server = fastify();
    server.get('/pkg/foo', async () => {
        return {
            versions: [
                [1, { version: '1.3.2' }],
                [2, { version: '2.1.8' }],
            ],
        };
    });
    const address = await server.listen();

    const version = await f.latestVersion(address, 'foo');

    t.equal(version, '2.1.8', 'Version should match expected value');

    await server.close();
});

test('fetch latest version, filtered by major, for a given published bundle', async (t) => {
    const server = fastify();
    server.get('/pkg/foo', async () => {
        return {
            versions: [
                [1, { version: '1.3.2' }],
                [2, { version: '2.1.8' }],
            ],
        };
    });
    const address = await server.listen();

    const version = await f.latestVersion(address, 'foo', 1);

    t.equal(version, '1.3.2', 'Version should match expected value');

    await server.close();
});

test('fetch latest version for a given published bundle, non existant bundle on server', async (t) => {
    const server = fastify();
    const address = await server.listen();

    try {
        await f.latestVersion(address, 'foo');
    } catch (err) {
        t.equal(
            err.message,
            'Server responded with non 200 status code.',
            'Error message should indicate a server failure',
        );
    }

    await server.close();
});

test('fetch latest version, filtered by major, for a given published bundle', async (t) => {
    const server = fastify();
    server.get('/pkg/foo', async () => {
        return '';
    });
    const address = await server.listen();

    try {
        await f.latestVersion(address, 'foo');
    } catch (err) {
        t.equal(
            err.message,
            'An error occurred while attempting to parse json response from server.',
            'Error message should indicate a JSON parsing issue',
        );
    }

    await server.close();
});

test('fetch latest version, invalid versions returned by server', async (t) => {
    const server = fastify();
    server.get('/pkg/foo', async () => {
        return { versions: 1 };
    });
    const address = await server.listen();

    t.rejects(
        f.latestVersion(address, 'foo'),
        'should throw when server responds with invalid version object',
    );

    await server.close();
});

test('fetch latest version, invalid versions keys returned by server', async (t) => {
    const server = fastify();
    server.get('/pkg/foo', async () => {
        return {
            versions: [
                ['not a number', 1],
                ['also not a number', 2],
            ],
        };
    });
    const address = await server.listen();

    t.rejects(
        f.latestVersion(address, 'foo'),
        'should throw when server responds with invalid version keys',
    );

    await server.close();
});

test('fetch latest version, no bundles yet published', async (t) => {
    const server = fastify();
    server.get('/pkg/foo', async () => {
        return {
            latest: {},
            versions: [],
        };
    });
    const address = await server.listen();

    const version = await f.latestVersion(address, 'foo');

    t.equal(version, null, 'Version should be null');

    await server.close();
});

test('fetch remote hash for a given version', async (t) => {
    const server = fastify();
    server.get('/pkg/foo/1.0.0', async () => {
        return {
            integrity:
                'sha512-36Ug1lJ/p/H0n5+or1HDLrqLaI3nvB7j2f7PC9RIzWd3T5GE4CfOuClEZRiNsf/F4BjT5FnS9mz0EzeDHpu3uw==',
            files: [
                {
                    integrity:
                        'sha512-T2qS6EBvOIu10bhUas3FhD39KkwIiXxplJ13q2EdXcA7nlYljlLKaymKhqz49f7qrEKhdISc4q5N+bk0Y1Y/NA==',
                },
                {
                    integrity:
                        'sha512-0K6U6pmI04xIBGE+KgfSRNMY0gBmKAwjWzZ+DM/tkicZSG+Uz5erTFw1Zru/0wXUPs256glMX24n0f1Q4z62tw==',
                },
            ],
        };
    });
    const address = await server.listen();
    const result = await f.integrity(address, 'foo', '1.0.0');

    t.equal(
        result,
        'sha512-36Ug1lJ/p/H0n5+or1HDLrqLaI3nvB7j2f7PC9RIzWd3T5GE4CfOuClEZRiNsf/F4BjT5FnS9mz0EzeDHpu3uw==',
        'should return correct hash',
    );
    await server.close();
});

test('write JSON file - object - file relative to cwd', async (t) => {
    const cwd = join(__dirname, 'tmp');
    await j.write(
        { version: '1.0.0', integrity: [] },
        { cwd, filename: '.eikrc' },
    );
    const eikrc = fs.readFileSync(join(cwd, '.eikrc'));
    const { version, integrity } = JSON.parse(eikrc);

    t.equal(version, '1.0.0', 'Version should be 1.0.0');
    t.same(integrity, [], 'Integrity should be an array');
});

test('write JSON file - object - file absolute path', async (t) => {
    const cwd = join(__dirname, 'tmp');
    await j.write({ prop: 'val' }, { filename: join(cwd, 'test.json') });
    const eikrc = fs.readFileSync(join(cwd, 'test.json'));
    const { prop } = JSON.parse(eikrc);

    t.equal(prop, 'val', 'Prop should equal val');
});

test('write JSON file - string - file relative path', async (t) => {
    await j.write({ prop: 'val' }, './test-using-relative.json');
    const eikrc = fs.readFileSync(
        join(__dirname, '../test-using-relative.json'),
    );
    const { prop } = JSON.parse(eikrc);
    await fs.unlinkSync(join(__dirname, '../test-using-relative.json'));

    t.equal(prop, 'val', 'Prop should equal val');
});

test('write JSON file - string - file absolute path', async (t) => {
    const cwd = join(__dirname, 'tmp');
    await j.write({ prop: 'val' }, join(cwd, 'test3.json'));
    const eikrc = fs.readFileSync(join(cwd, 'test3.json'));
    const { prop } = JSON.parse(eikrc);

    t.equal(prop, 'val', 'Prop should equal val');
});

test('read JSON file - object - file relative path', async (t) => {
    const cwd = join(__dirname, 'tmp');
    fs.writeFileSync(join(cwd, 'test3.json'), JSON.stringify({ key: 'val' }));
    const json = await j.read({ cwd, filename: './test3.json' });

    t.equal(json.key, 'val', 'Key should equal val');
});

test('read JSON file - object - file absolute path', async (t) => {
    const cwd = join(__dirname, 'tmp');
    fs.writeFileSync(join(cwd, 'test3.json'), JSON.stringify({ key: 'val' }));
    const json = await j.read({ filename: join(cwd, './test3.json') });

    t.equal(json.key, 'val', 'Key should equal val');
});

test('read JSON file - string - file relative path', async (t) => {
    fs.writeFileSync(
        join(__dirname, '../test-read-json.json'),
        JSON.stringify({ key: 'val' }),
    );
    const json = await j.read('./test-read-json.json');

    t.equal(json.key, 'val', 'Key should equal val');
});

test('read JSON file - string - file absolute path', async (t) => {
    const cwd = join(__dirname, 'tmp');
    fs.writeFileSync(
        join(cwd, './test-read-json-2.json'),
        JSON.stringify({ key: 'val' }),
    );
    const json = await j.read(join(cwd, './test-read-json-2.json'));

    t.equal(json.key, 'val', 'Key should equal val');
});

test('entrypoints: basic mapping dest path to file source', async (t) => {
    const cwd = join(__dirname, 'tmp');
    const path = join(cwd, '.eik');
    const src = join(__dirname, './fixtures/client.js');
    const dest = join(path, './index.js');

    const map = await entrypoints({ './index.js': src }, path, { cwd });

    t.equal(map.get(src), dest, 'File source should point to destination');
});

test('entrypoints: error thrown when glob used with specific file mapping', async (t) => {
    const cwd = join(__dirname, 'tmp');
    const path = join(cwd, '.eik');
    const src = join(__dirname, './**/client.js');

    t.rejects(async () => entrypoints({ './index.js': src }, path, { cwd }));
});

test('entrypoints: matching dest path to file source', async (t) => {
    const cwd = join(__dirname, 'tmp');
    const path = join(cwd, '.eik');
    const src1 = join(__dirname, './fixtures/client.js');
    const dest1 = join(path, './src/client.js');

    const map = await entrypoints({ './src': '../fixtures/client.js' }, path, { cwd });

    t.equal(map.get(src1), dest1, 'File source should point to destination');
});

test('entrypoints: matching dest path to file source', async (t) => {
    const cwd = join(__dirname, 'tmp');
    const path = join(cwd, '.eik');
    const src1 = join(__dirname, './fixtures/client.js');
    const src2 = join(__dirname, './fixtures/client-with-bare-imports.js');
    const dest1 = join(path, './src/client.js');
    const dest2 = join(path, './src/client-with-bare-imports.js');

    const map = await entrypoints({ './src': '../fixtures/*.js' }, path, { cwd });

    t.equal(map.get(src1), dest1, 'File source should point to destination');
    t.equal(map.get(src2), dest2, 'File source should point to destination');
});

test('entrypoints: glob matching dest path to file source', async (t) => {
    const cwd = join(__dirname, 'tmp');
    const path = join(cwd, '.eik');
    const src1 = join(__dirname, './fixtures/client.js');
    const src2 = join(__dirname, './integration/react/client.js');
    const dest1 = join(path, './src/fixtures/client.js');
    const dest2 = join(path, './src/integration/react/client.js');

    const map = await entrypoints({ './src': '../**/client.js' }, path, { cwd });

    t.equal(map.get(src1), dest1, 'File source should point to destination');
    t.equal(map.get(src2), dest2, 'File source should point to destination');
});

test('entrypoints: glob matching dest path to file source, root path', async (t) => {
    const cwd = join(__dirname, 'tmp');
    const path = join(cwd, '.eik');
    const src1 = join(__dirname, './fixtures/client.js');
    const src2 = join(__dirname, './integration/react/client.js');
    const dest1 = join(path, './fixtures/client.js');
    const dest2 = join(path, './integration/react/client.js');

    const map = await entrypoints({ './': '../**/client.js' }, path, { cwd });

    t.equal(map.get(src1), dest1, 'File source should point to destination');
    t.equal(map.get(src2), dest2, 'File source should point to destination');
});

test('entrypoints: glob matching dest path to file source, root path 2', async (t) => {
    const cwd = join(__dirname, 'tmp');
    const path = join(cwd, '.eik');
    const src1 = join(__dirname, './fixtures/client.js');
    const src2 = join(__dirname, './integration/react/client.js');
    const dest1 = join(path, './fixtures/client.js');
    const dest2 = join(path, './integration/react/client.js');

    const map = await entrypoints({ '/': '../**/client.js' }, path, { cwd });

    t.equal(map.get(src1), dest1, 'File source should point to destination');
    t.equal(map.get(src2), dest2, 'File source should point to destination');
});

test('entrypoints: glob matching dest path to file source, root path 2', async (t) => {
    const cwd = join(__dirname, 'tmp');
    const path = join(cwd, '.eik');
    const src1 = join(__dirname, './fixtures/client.js');
    const dest1 = join(path, './client.js');

    const map = await entrypoints({ '/': '../fixtures/*.js' }, path, { cwd });

    t.equal(map.get(src1), dest1, 'File source should point to destination');
});

test('entrypoints: glob matching dest path to file source, root path 3', async (t) => {
    const cwd = join(__dirname, 'tmp');
    const path = join(cwd, '.eik');
    const src1 = join(__dirname, './fixtures/client.js');
    const src2 = join(__dirname, './fixtures/client-with-bare-imports.js');
    const dest1 = join(path, './client.js');
    const dest2 = join(path, './client-with-bare-imports.js');

    const map = await entrypoints({ '/': '../fixtures/*.js' }, path, { cwd });

    t.equal(map.get(src1), dest1, 'File source should point to destination');
    t.equal(map.get(src2), dest2, 'File source should point to destination');
});

test('entrypoints: glob matching dest path to file source, root path 4', async (t) => {
    const cwd = join(__dirname, 'tmp');
    const path = join(cwd, '.eik');
    const src1 = join(__dirname, './fixtures/client.js');
    const dest1 = join(path, './client.js');

    const map = await entrypoints({ '/': '../fixtures/client.js' }, path, { cwd });

    t.equal(map.get(src1), dest1, 'File source should point to destination');
});