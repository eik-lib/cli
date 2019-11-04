'use strict';

const { readFileSync } = require('fs');
const resolvePath = require('./resolve-path');

function readAssetsJson() {
    try {
        const { pathname } = resolvePath('./assets.json');
        return JSON.parse(readFileSync(pathname));
    } catch (err) {
        throw new Error(`Unable to locate assets file: ${err.message}`);
    }
}

module.exports = readAssetsJson;
