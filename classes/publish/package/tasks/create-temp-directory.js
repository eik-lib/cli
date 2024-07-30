/* eslint-disable max-classes-per-file */
import mkdir from 'make-dir';
import Task from './task.js';

class IOError extends Error {
    constructor(message, err) {
        super(`${message}: ${err.message}`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default class CreateTempDir extends Task {
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
