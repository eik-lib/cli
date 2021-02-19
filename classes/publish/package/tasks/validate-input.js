/* eslint-disable max-classes-per-file */

'use strict';

const { parse } = require('path');
const Task = require('./task');

class ValidationError extends Error {
    constructor(message, err) {
        let m = message;
        if (err && err.message) m += `: ${err.message}`;
        super(m);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = class ValidateInput extends Task {
    process() {
        const { log } = this;
        const { cwd, dryRun } = this.config;

        log.debug('Validating input');

        try {
            log.debug(`  ==> cwd: ${cwd}`);
            parse(cwd);
        } catch (err) {
            throw new ValidationError('Parameter "cwd" is not valid', err);
        }

        log.debug(`  ==> dryRun: ${dryRun}`);
        if (dryRun && dryRun !== true && dryRun !== false) {
            throw new ValidationError('Parameter "dryRun" is not valid');
        }
    }
};
