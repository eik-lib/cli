'use strict';

const abslog = require('abslog');
const schemas = require('@eik/common-schemas');
const { request } = require('../utils/http');

module.exports = class Login {
    constructor({ logger, server, key } = {}) {
        this.log = abslog(logger);
        this.server = server;
        this.key = key;
    }

    async run() {
        this.log.debug('Validating input');

        try {
            schemas.assert.server(this.server);
            if (!this.key || typeof !this.key === 'string') {
                throw new schemas.ValidationError('"key" must be a string');
            }
        } catch (err) {
            this.log.error(err.message);
            return false;
        }

        this.log.debug('Requesting jwt token from server');
        try {
            const { message } = await request({
                host: this.server,
                method: 'POST',
                pathname: '/auth/login',
                data: { key: this.key },
            });

            this.log.info(`Login successful`);
            return message.token;
        } catch (err) {
            switch (err.statusCode) {
                case 401:
                    this.log.info('Login unsuccessful. Invalid credentials.');
                    return false;
                default:
                    this.log.warn('Login unsuccessful. Unknown login error');
                    return false;
            }
        }
    }
};
