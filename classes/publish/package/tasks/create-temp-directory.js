/* eslint-disable max-classes-per-file */

'use strict';

const mkdir = require('make-dir');
const Task = require('./task');

class IOError extends Error {
    constructor(message, err) {
        super(`${message}: ${err.message}`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = class CreateTempDir extends Task {
    async process() {
        const { log, path } = this;

        log.debug(`Creating temporary directory`);
        log.debug(`  ==> ${path}`);

        try {
            mkdir.sync(path);
        } catch (err) {
            throw new IOError('Unable to create temp dir', err);
        }
    }
};
