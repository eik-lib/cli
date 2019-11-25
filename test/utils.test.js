'use strict';

const crypto = require('crypto');
const { join } = require('path');
const { test } = require('tap');
const fastify = require('fastify');
const u = require('../utils');

test('calculate file hash', async t => {
    const hash = await u.calculateFileHash(
        join(__dirname, 'fixtures', 'client.js'),
    );
    t.equal(
        hash,
        'sha512-7y37q0qk5mDqzHrGvJAR9J8kPX+orJhuO+KrCTKw11ZKRI/5udUuKt2Zb/thH5H39OQYrvnHTLbZS9ShG/lGCg==',
        'returned hash should match',
    );
});

test('calculate files hash', async t => {
    const hash = await u.calculateFilesHash([
        join(__dirname, 'fixtures', 'styles.css'),
        join(__dirname, 'fixtures', 'client.js'),
        join(__dirname, 'fixtures', 'import-map.json'),
    ]);

    const fileHash1 = await u.calculateFileHash(
        join(__dirname, 'fixtures', 'client.js'),
    );
    const fileHash2 = await u.calculateFileHash(
        join(__dirname, 'fixtures', 'import-map.json'),
    );
    const fileHash3 = await u.calculateFileHash(
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

test('compare hashes - true', async t => {
    const fileHash1 = await u.calculateFileHash(
        join(__dirname, 'fixtures', 'client.js'),
    );
    const fileHash2 = await u.calculateFileHash(
        join(__dirname, 'fixtures', 'client.js'),
    );

    t.equal(
        u.compareHashes(fileHash1, fileHash2),
        true,
        'hashes compared should produce a true result',
    );
});

test('compare hashes - false', async t => {
    const fileHash1 = await u.calculateFileHash(
        join(__dirname, 'fixtures', 'client.js'),
    );
    const fileHash2 = await u.calculateFileHash(
        join(__dirname, 'fixtures', 'import-map.json'),
    );

    t.equal(
        u.compareHashes(fileHash1, fileHash2),
        false,
        'hashes compared should produce a false result',
    );
});

test('increment semver version - invalid semver', async t => {
    const semver = 'foo';

    try {
        u.incrementSemverVersion(semver, 'patch');
    } catch (err) {
        t.equal(
            err.message,
            'Invalid semver given. Argument must be of the form x.x.x. Eg. 1.0.0',
            'incrementing invalid semver should throw correct error',
        );
    }
});

test('increment semver version - invalid incrementation level given', async t => {
    const semver = '1.0.0';

    try {
        u.incrementSemverVersion(semver, 'foo');
    } catch (err) {
        t.equal(
            err.message,
            `Invalid incrementation level given. Argument must be one of 'major', 'minor' or 'patch'`,
            'incrementing invalid semver should throw correct error',
        );
    }
});

test('increment semver version - valid semver - patch increment', async t => {
    const semver = '1.0.0';
    const result = u.incrementSemverVersion(semver, 'patch');
    t.equal(result, '1.0.1', 'incremented semver should now be 1.0.1');
});

test('increment semver version - valid semver - minor increment', async t => {
    const semver = '1.0.0';
    const result = u.incrementSemverVersion(semver, 'minor');
    t.equal(result, '1.1.0', 'incremented semver should now be 1.1.0');
});

test('increment semver version - valid semver - major increment', async t => {
    const semver = '1.0.0';
    const result = u.incrementSemverVersion(semver, 'major');
    t.equal(result, '2.0.0', 'incremented semver should now be 2.0.0');
});

test('fetch latest version for a given published bundle', async t => {
    const server = fastify();
    server.get('/finn/pkg/foo', async () => {
        return {
            latest: { major: 2, latest: '2.1.8' },
            versions: [
                [1, { latest: '1.3.2' }],
                [2, { latest: '2.1.8' }],
            ],
        };
    });
    const address = await server.listen();

    const version = await u.fetchLatestVersion(address, 'finn', 'foo');

    t.equal(version, '2.1.8', 'Version should match expected value');

    await server.close();
});

test('fetch latest version, filtered by major, for a given published bundle', async t => {
    const server = fastify();
    server.get('/finn/pkg/foo', async () => {
        return {
            latest: { major: 2, latest: '2.1.8' },
            versions: [
                [1, { latest: '1.3.2' }],
                [2, { latest: '2.1.8' }],
            ],
        };
    });
    const address = await server.listen();

    const version = await u.fetchLatestVersion(address, 'finn', 'foo', 1);

    t.equal(version, '1.3.2', 'Version should match expected value');

    await server.close();
});

test('fetch latest version for a given published bundle, non existant bundle on server', async t => {
    const server = fastify();
    const address = await server.listen();

    try {
        await u.fetchLatestVersion(address, 'finn', 'foo');
    } catch (err) {
        t.equal(
            err.message,
            'Server responded with non 200 status code.',
            'Error message should indicate a server failure',
        );
    }

    await server.close();
});

test('fetch latest version, filtered by major, for a given published bundle', async t => {
    const server = fastify();
    server.get('/finn/pkg/foo', async () => {
        return '';
    });
    const address = await server.listen();

    try {
        await u.fetchLatestVersion(address, 'finn', 'foo');
    } catch (err) {
        t.equal(
            err.message,
            'An error occurred while attempting to parse json response from server.',
            'Error message should indicate a JSON parsing issue',
        );
    }

    await server.close();
});

test('fetch latest version, invalid versions returned by server', async t => {
    const server = fastify();
    server.get('/finn/pkg/foo', async () => {
        return { versions: 1 };
    });
    const address = await server.listen();

    t.rejects(
        u.fetchLatestVersion(address, 'finn', 'foo'),
        'should throw when server responds with invalid version object',
    );

    await server.close();
});

test('fetch latest version, invalid versions keys returned by server', async t => {
    const server = fastify();
    server.get('/finn/pkg/foo', async () => {
        return {
            versions: [
                ['not a number', 1],
                ['also not a number', 2],
            ],
        };
    });
    const address = await server.listen();

    t.rejects(
        u.fetchLatestVersion(address, 'finn', 'foo'),
        'should throw when server responds with invalid version keys',
    );

    await server.close();
});

test('fetch latest version, no bundles yet published', async t => {
    const server = fastify();
    server.get('/finn/pkg/foo', async () => {
        return {
            latest: {},
            versions: [],
        };
    });
    const address = await server.listen();

    const version = await u.fetchLatestVersion(address, 'finn', 'foo');

    t.equal(version, null, 'Version should be null');

    await server.close();
});

test('fetch remote hash for a given version', async t => {
    const server = fastify();
    server.get('/finn/pkg/foo/1.0.0', async () => {
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
    const result = await u.fetchPackageMeta(address, 'finn', 'foo', '1.0.0');

    t.equal(
        result.integrity,
        'sha512-36Ug1lJ/p/H0n5+or1HDLrqLaI3nvB7j2f7PC9RIzWd3T5GE4CfOuClEZRiNsf/F4BjT5FnS9mz0EzeDHpu3uw==',
        'should return correct hash',
    );
    await server.close();
});
