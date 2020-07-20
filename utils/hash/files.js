'use strict';

const ssri = require('ssri');
const fileHash = require('./file');

module.exports = async files => {
    const hashes = await Promise.all(files.map(fileHash));
    const hasher = ssri.create();
    for (const hash of hashes.sort()) {
        hasher.update(hash);
    }
    const integrity = hasher.digest()
    return integrity.toString();
};
