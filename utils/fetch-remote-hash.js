'use strict';

const { join } = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch');

module.exports = async (server, org, name, version) => {
    const res = await fetch(`${server}/${join(org, 'pkg', name, version)}`);

    if (!res.ok) {
        throw new Error('Server responded with non 200 status code.');
    }

    let body;
    try {
        body = await res.json();
    } catch (err) {
        throw new Error(
            'An error occurred while attempting to parse json response from server.',
        );
    }

    const { files } = body || {};

    let hashes;
    try {
        hashes = files.map(file => file.integrity).sort();
    } catch (err) {
        throw new Error(
            'An error occurred while attempting to map and sort file integrity hashes.',
        );
    }

    try {
        const hasher = crypto.createHash('sha512');
        for (const hash of hashes) {
            hasher.update(hash);
        }
        return hasher.digest('base64');
    } catch (err) {
        throw new Error(
            'An error occurred while attempting to produce a hash of file integrity hashes.',
        );
    }
};
