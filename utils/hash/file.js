'use strict';

const ssri = require('ssri');
const fs = require('fs');

/**
 * Reads a file from a given path and produces and returns an integrity hash from its contents
 *
 * @param {string} path - path to file to hash
 *
 * @returns {Promise<string>} - integrity hash
 *
 * @example hash.file('/path/to/file.js');
 */
module.exports = async (path) => {
    const integrity = await ssri.fromStream(fs.createReadStream(path));
    return integrity.toString();
};
