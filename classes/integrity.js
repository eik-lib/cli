/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */

'use strict';

const abslog = require('abslog');
const { join } = require('path');
const { schemas, ValidationError } = require('@eik/common');
const fetch = require('node-fetch');

module.exports = class Integrity {
    constructor({
        logger,
        name,
        version,
        server,
        debug = false,
        cwd = process.cwd(),
    } = {}) {
        this.log = abslog(logger);
        this.server = server;
        this.name = name;
        this.version = version;
        this.debug = debug;
        this.cwd = cwd;
    }

    async run() {
        this.log.debug('Validating input');

        try {
            this.log.debug(`  ==> server: ${this.server}`);
            schemas.assert.server(this.server);

            this.log.debug(`  ==> name: ${this.name}`);
            schemas.assert.name(this.name);

            this.log.debug(`  ==> version: ${this.version}`);
            schemas.assert.version(this.version);

            this.log.debug(`  ==> debug: ${this.debug}`);
            if (typeof this.debug !== 'boolean') {
                throw new ValidationError(`Parameter "debug" is not valid`);
            }

            this.log.debug(`  ==> cwd: ${this.cwd}`);
            if (typeof this.cwd !== 'string') {
                throw new ValidationError(`Parameter "cwd" is not valid`);
            }
        } catch (err) {
            this.log.error(err.message);
            return false;
        }

        this.log.debug('Requesting meta information from asset server');
        try {
            const url = new URL(
                join('pkg', this.name, this.version),
                this.server,
            );
            this.log.debug(`  ==> url: ${url}`);

            const res = await fetch(url);

            if (res.ok) {
                this.log.debug(`  ==> ok: true`);
                const data = await res.json();

                const files = {};
                for (const file of data.files) {
                    files[file.pathname] = file.integrity;
                }

                return {
                    name: data.name,
                    version: data.version,
                    integrity: data.integrity,
                    files,
                };
            }

            this.log.debug(`  ==> ok: false`);

            if (res.status === 400) {
                throw new Error(
                    'Client attempted to send an invalid URL parameter',
                );
            }

            if (res.status === 401) {
                throw new Error('Client unauthorized with server');
            }

            throw new Error('Server Error');
        } catch (err) {
            this.log.error('Unable to retrieve meta information for package');
            this.log.warn(err.message);
            return false;
        }
    }
};
