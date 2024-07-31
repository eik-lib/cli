import ssri from 'ssri';
import fs from 'fs';

/**
 * Reads a file from a given path and produces and returns an integrity hash from its contents
 *
 * @param {string} path - path to file to hash
 *
 * @returns {Promise<string>} - integrity hash
 *
 * @example hash.file('/path/to/file.js');
 */
export default async (path) => {
    const integrity = await ssri.fromStream(fs.createReadStream(path));
    return integrity.toString();
};
