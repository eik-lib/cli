'use strict';

const resolvePath = require('./resolve-path');

function readAssetsJson() {
    try {
        const { pathname } = resolvePath('./assets.json');
        return require(pathname);
    } catch (err) {
        throw new Error(`Unable to locate assets file: ${err.message}`);
    }
}

module.exports = readAssetsJson;
