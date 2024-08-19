import abslog from 'abslog';
import eik from '@eik/common';
import { request } from '../utils/http/index.js';

const { schemas } = eik;

/**
 * @typedef {object} LoginOptions
 * @property {import('abslog').AbstractLoggerOptions} [logger]
 * @property {string} server
 * @property {string} key
 */

export default class Login {
    /**
     * @param {LoginOptions} options
     */
    constructor({ logger, server, key }) {
        this.log = abslog(logger);
        this.server = server;
        this.key = key;
    }

    /**
     * @returns {Promise<string | false>} Bearer token, or false if login fails
     */
    async run() {
        this.log.debug('Validating input');

        try {
            schemas.assert.server(this.server);
            if (!this.key || typeof !this.key === 'string') {
                // @ts-expect-error
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
                pathname: 'auth/login',
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
}
