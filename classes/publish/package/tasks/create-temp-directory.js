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
    async process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { path } = incoming;

        log.debug('Creating temporary directory');

        try {
            mkdir.sync(path);
        } catch (err) {
            throw new IOError('Unable to create temp dir', err);
        }

        return outgoing;
    }
};
