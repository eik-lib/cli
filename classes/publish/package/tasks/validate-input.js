/* eslint-disable max-classes-per-file */
import { parse } from 'path';
import Task from './task.js';

class ValidationError extends Error {
    constructor(message, err) {
        let m = message;
        if (err && err.message) m += `: ${err.message}`;
        super(m);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default class ValidateInput extends Task {
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
}
