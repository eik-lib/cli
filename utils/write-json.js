'use strict';

const fs = require('fs').promises;
const { join, isAbsolute, dirname } = require('path');

module.exports = async (meta = {}, { cwd = process.cwd(), filename }) => {
    const path = isAbsolute(filename) ? filename : join(cwd, filename);
    try {
        await fs.mkdir(dirname(path), { recursive: true });
        await fs.writeFile(path, JSON.stringify(meta, null, 2));
    } catch(err) {
        throw new Error(`Error writing to JSON file ["${path}"]: ${err.message}`);
    }
};
