import ssri from 'ssri';
import fileHash from './file.js';

/**
 * Reads files from given paths and produces and returns an integrity hash from all files contents
 *
 * @param {[string]} files - an array of file paths
 *
 * @returns {Promise<string>} - integrity string
 *
 * @example hash.files(['/path/to/file1.js', '/path/to/file2.js']);
 */
export default async (files) => {
    const hashes = await Promise.all(files.map(fileHash));
    const hasher = ssri.create();
    for (const hash of hashes.sort()) {
        hasher.update(hash);
    }
    const integrity = hasher.digest();
    return integrity.toString();
};
