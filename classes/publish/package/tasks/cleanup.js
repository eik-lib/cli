'use strict';

const { join } = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const Task = require('./task');

module.exports = class Cleanup extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { path } = incoming;
        const { log } = this;
        log.debug('Cleaning up');

        if (fs.existsSync(path)) {
            fs.readdirSync(path)
                .filter((file) => file !== 'integrity.json')
                .forEach((file) => rimraf.sync(join(path, file)));
        }

        return outgoing;
    }
};
