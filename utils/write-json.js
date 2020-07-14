'use strict';

const fs = require('fs').promises;
const { join, isAbsolute, dirname } = require('path');

/**
 * Utility function that can be used to write a JavaScript object to a file at a given location.
 *
 * @param {object} meta - JavaScript object to be written as JSON to a file
 * @param {string|object} location - Path string or object describing location for where to write JSON to.
 *                                   If location is a string it can be relative or absolute.
 *                                   If location is an object, `pathname` must be given which can be relative or absolute. `cwd` can also be given to define the current working directory.
 * @example writeJSON({ key: 'value' }, '/path/to/file.json');
 * @example writeJSON({ key: 'value' }, './relative/path/to/file.json');
 * @example writeJSON({ key: 'value' }, { filename: '/path/to/file.json' });
 * @example writeJSON({ key: 'value' }, { filename: './relative/path/to/file.json' });
 * @example writeJSON({ key: 'value' }, { filename: './relative/path/to/file.json', cwd: '/path/to/cwd' });
 */
module.exports = async (meta = {}, location) => {
    let cwd = process.cwd();
    let filename = '';
    if (typeof location === 'string') {
        filename = location;
    } else {
        filename = location.filename;
        if (location.cwd) {
            cwd = location.cwd;
        }
    }
    const path = isAbsolute(filename) ? filename : join(cwd, filename);
    try {
        await fs.mkdir(dirname(path), { recursive: true });
        await fs.writeFile(path, JSON.stringify(meta, null, 2));
    } catch (err) {
        throw new Error(
            `Error writing to JSON file ["${path}"]: ${err.message}`,
        );
    }
};
