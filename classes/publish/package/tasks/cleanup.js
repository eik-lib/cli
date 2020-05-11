'use strict';

const fs = require('fs');
const rimraf = require('rimraf');
const Task = require('./task');

module.exports = class Cleanup extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { path } = incoming;
        const { log } = this;
        log.debug('Cleaning up');

        if (fs.existsSync(path)) {
            rimraf.sync(path);
        }

        return outgoing;
    }
};
