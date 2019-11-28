'use strict';

const fs = require('fs');
const rimraf = require('rimraf');

module.exports = class Cleanup {
    async process(state = {}) {
        const { path, log } = state;
        log.debug('Cleaning up');

        if (fs.existsSync(path)) {
            rimraf.sync(path);
        }

        return state;
    }
};
