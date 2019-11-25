'use strict';

const crypto = require('crypto');
const fileHash = require('./calculate-file-hash');

module.exports = async files => {
    const hashes = await Promise.all(files.map(fileHash));
    const hasher = crypto.createHash('sha512');
    for (const hash of hashes.sort()) {
        hasher.update(hash);
    }
    return hasher.digest('base64');
};
