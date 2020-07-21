'use strict';

const assert = require('assert');
const fs = require('fs').promises;
const { join, isAbsolute, dirname } = require('path');

/**
 * Utility function that can be used to write a JavaScript object to a file at a given location.
 *
 * @param {object} meta - JavaScript object to be written as JSON to a file
 * @param {string|{cwd:string,filename:string}} location - Path string or object describing location for where to write JSON to.
 *                                   If location is a string it can be relative or absolute.
 *                                   If location is an object, `pathname` must be given which can be relative or absolute. `cwd` can also be given to define the current working directory.
 * @returns {Promise<undefined>}
 * 
 * @example json.write({ key: 'value' }, '/path/to/file.json');
 * @example json.write({ key: 'value' }, './relative/path/to/file.json');
 * @example json.write({ key: 'value' }, { filename: '/path/to/file.json' });
 * @example json.write({ key: 'value' }, { filename: './relative/path/to/file.json' });
 * @example json.write({ key: 'value' }, { filename: './relative/path/to/file.json', cwd: '/path/to/cwd' });
 * 
 * @throws Error
 */
module.exports = async (meta = {}, location) => {
    if (typeof location !== 'string') {
        assert(
            location.filename,
            'When "location" is not of type "string" then it must be an "object" with property "filename"',
        );
    }
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
