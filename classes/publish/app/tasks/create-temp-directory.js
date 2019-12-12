/* eslint-disable max-classes-per-file */

'use strict';

const { join } = require('path');
const mkdir = require('make-dir');

class IOError extends Error {
    constructor(message, err) {
        super(`${message}: ${err.message}`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = class CreateTempDir {
    async process(state = {}) {
        const { path, log } = state;

        log.debug('Creating temporary directory');

        try {
            mkdir.sync(path);
            mkdir.sync(join(path, 'main'));
            mkdir.sync(join(path, 'ie11'));
        } catch (err) {
            throw new IOError('Unable to create temp dir', err);
        }

        return state;
    }
};
