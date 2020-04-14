/* eslint-disable max-classes-per-file */

'use strict';

const { parse } = require('path');
const { validators } = require('@eik/common');

class ValidationError extends Error {
    constructor(message, err) {
        super(`${message}: ${err.message}`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = class ValidateInput {
    process(state = {}) {
        const { log, cwd, server, name, js, css, map, dryRun } = state;

        log.debug('Validating input');

        try {
            parse(cwd);
        } catch (err) {
            throw new ValidationError('Parameter "cwd" is not valid', err);
        }

        try {
            validators.origin(server);
        } catch (err) {
            throw new ValidationError(`Parameter "server" is not valid`, err);
        }

        try {
            validators.name(name);
        } catch (err) {
            throw new ValidationError('Parameter "name" is not valid', err);
        }

        if (!js && !css) {
            throw new ValidationError(
                'At least one of "js" or "css" must be provided',
            );
        }

        if (js && typeof js !== 'string') {
            throw new ValidationError('Parameter "js" is not valid');
        }

        if (css && typeof css !== 'string') {
            throw new ValidationError('Parameter "css" is not valid');
        }

        if (!Array.isArray(map)) {
            throw new ValidationError('Parameter "map" is not valid');
        }

        if (dryRun && dryRun !== true && dryRun !== false) {
            throw new ValidationError('Parameter "dryRun" is not valid');
        }

        return state;
    }
};
