'use strict';

const fs = require('fs').promises;
const { join } = require('path');

module.exports = async ({ cwd = process.cwd(), filename = '.eikrc' } = {}) => {
    try {
        const path = join(cwd, filename);
        const meta = await fs.readFile(path, 'utf8');
        return JSON.parse(meta);
    } catch (err) {
        return {
            token: null,
            version: null,
            integrity: null,
            development: { js: '', css: '' },
        };
    }
};
