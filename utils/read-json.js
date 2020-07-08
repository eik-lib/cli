'use strict';

const fs = require('fs').promises;
const { join, isAbsolute } = require('path');

module.exports = async ({ cwd = process.cwd(), filename } = {}) => {
    const path = isAbsolute(filename) ? filename : join(cwd, filename);
    try {
        const meta = await fs.readFile(path, 'utf8');
        return JSON.parse(meta);
    } catch (err) {
        return {};
    }
};
