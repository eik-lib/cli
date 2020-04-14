'use strict';

const abslog = require('abslog');
const { join } = require('path');
const { validators } = require('@eik/common');
const fetch = require('node-fetch');

module.exports = class Meta {
    constructor({ logger, server, name, version } = {}) {
        this.log = abslog(logger);
        this.server = server;
        this.name = name;
        this.version = version;
    }

    async run() {
        this.log.debug('Validating input');

        try {
            validators.origin(this.server);
        } catch (err) {
            this.log.error(`Parameter "server" is not valid`);
            return false;
        }

        try {
            validators.name(this.name);
            validators.version(this.version);
        } catch (err) {
            this.log.error(err.message);
            return false;
        }

        this.log.debug('Requesting meta information from asset server');
        try {
            const res = await fetch(
                `${this.server}/${join(
                    'pkg',
                    this.name,
                    this.version,
                )}`,
            );

            if (!res.ok) {
                this.log.error(
                    'Unable to retrieve meta information for package',
                );
                switch (res.status) {
                    case 400:
                        this.log.warn(
                            'Client attempted to send an invalid URL parameter',
                        );
                        break;
                    case 401:
                        this.log.warn('Client unauthorized with server');
                        break;
                    case 404:
                        this.log.warn(
                            'The server was unable to locate the required resource',
                        );
                        break;
                    default:
                        this.log.warn(`Server failed: ${await res.text()}`);
                }

                return false;
            }

            return await res.json();
        } catch (err) {
            this.log.error('Unable to retrieve meta information for package');
            this.log.warn(err.message);
            return false;
        }
    }
};
