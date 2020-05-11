'use strict';

const fs = require('fs');
const rimraf = require('rimraf');

module.exports = class Cleanup {
    async process(incoming = {}, outgoing = {}) {
        const { path, log } = incoming;
        log.debug('Cleaning up');

        if (fs.existsSync(path)) {
            rimraf.sync(path);
        }

        return outgoing;
    }
};
