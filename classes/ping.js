'use strict';

const fetch = require('node-fetch');
const abslog = require('abslog');
const schemas = require('@eik/common-schemas');

module.exports = class Ping {
    constructor({ logger, server } = {}) {
        this.log = abslog(logger);
        this.server = server;
    }

    async run() {
        this.log.debug('Validating input');

        try {
            schemas.assert.server(this.server);
        } catch (err) {
            this.log.error(err.message);
            return false;
        }

        this.log.debug('Requesting ping from server');
        try {
            const result = await fetch(this.server);

            if (!result.ok) {
                const err = new Error('Ping unsuccessful');
                err.statusCode = result.status;
                throw err;
            }

            this.log.info(`Ping successful`);
            return true;
        } catch (err) {
            if (err.code === 'ENOTFOUND') {
                this.log.info('Ping unsuccessful. Server not found.');
                return false;
            }

            switch (err.statusCode) {
                case 404:
                    this.log.info('Ping unsuccessful. Route not found.');
                    return false;
                default:
                    this.log.warn('Ping unsuccessful. Unknown server error');
                    return false;
            }
        }
    }
};
