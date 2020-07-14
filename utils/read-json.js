'use strict';

const assert = require('assert');
const fs = require('fs').promises;
const { join, isAbsolute } = require('path');

/**
 * Reads a file at a given location, assumes the contents to be JSON and then deserializes into a JavaScript object
 *
 * @param {string|{filename:string,cwd:string}} location - Path string or object describing location for where to write JSON to.
 *                                   If location is a string it can be relative or absolute.
 *                                   If location is an object, `pathname` must be given which can be relative or absolute. `cwd` can also be given to define the current working directory.
 * @return {Promise<any{}>} - JavaScript object deserialized from JSON file contents
 *
 * @example readJSON('/path/to/file.json');
 * @example readJSON('./relative/path/to/file.json');
 * @example readJSON({ filename: '/path/to/file.json' });
 * @example readJSON({ filename: './relative/path/to/file.json' });
 * @example readJSON({ filename: './relative/path/to/file.json', cwd: '/path/to/cwd });
 */
module.exports = async (location) => {
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
        const meta = await fs.readFile(path, 'utf8');
        return JSON.parse(meta);
    } catch (err) {
        return {};
    }
};
