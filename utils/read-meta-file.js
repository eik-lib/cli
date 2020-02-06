'use strict';

const fs = require('fs').promises;
const { join } = require('path');

module.exports = async ({ path = join(process.cwd(), '.eikrc') } = {}) => {
    try {
        const meta = await fs.readFile(path, 'utf8');
        return JSON.parse(meta);
    } catch (err) {
        return {
            version: null,
            integrity: null,
            development: { js: '', css: '' },
        };
    }
};
