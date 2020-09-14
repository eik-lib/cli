/* eslint-disable max-classes-per-file */

'use strict';

const { parse } = require('path');
const { schemas: { assert } } = require('@eik/common');
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
    process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { cwd, server, name, files, map, dryRun, version, out } = incoming;

        log.debug('Validating input');

        try {
            log.debug(`  ==> cwd: ${cwd}`);
            parse(cwd);
        } catch (err) {
            throw new ValidationError('Parameter "cwd" is not valid', err);
        }

        log.debug(`  ==> server: ${server}`);
        assert.server(server);
        
        log.debug(`  ==> name: ${name}`);
        assert.name(name);

        log.debug(`  ==> version: ${version}`);
        assert.version(version)
        
        log.debug(`  ==> files: ${JSON.stringify(files)}`);
        assert.files(files);

        log.debug(`  ==> map: ${JSON.stringify(map)}`);
        assert.importMap(map);

        log.debug(`  ==> out: ${JSON.stringify(out)}`);
        assert.out(out);

        log.debug(`  ==> dryRun: ${dryRun}`);
        if (dryRun && dryRun !== true && dryRun !== false) {
            throw new ValidationError('Parameter "dryRun" is not valid');
        }

        return outgoing;
    }
};
