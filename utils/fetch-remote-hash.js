'use strict';

const { join } = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch');

module.exports = async (server, org, name, version) => {
    const hasher = crypto.createHash('sha512');
    const res = await fetch(`${server}/${join(org, 'pkg', name, version)}`);
    const body = await res.json();
    const hashes = body.files.map(file => file.integrity).sort();
    for (const hash of hashes) {
        hasher.update(hash);
    }
    return hasher.digest('base64');
};
