'use strict';

const abslog = require('abslog');
const { join } = require('path');
const { validators } = require('@eik/common');
const { sendCommand } = require('../utils');

module.exports = class Alias {
    constructor({ logger, server, org, type, name, version, alias } = {}) {
        this.log = abslog(logger);
        this.server = server;
        this.org = org;
        this.type = type;
        this.name = name;
        this.alias = alias;
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
            validators.org(this.org);
            validators.type(this.type);
            validators.name(this.name);
            validators.version(this.version);
            validators.alias(this.alias);
        } catch (err) {
            this.log.error(err.message);
            return false;
        }

        this.log.debug('Requesting alias creation from asset server');
        try {
            const { message } = await sendCommand({
                host: this.server,
                method: 'PUT',
                pathname: join(
                    this.org,
                    this.type,
                    this.name,
                    `v${this.alias}`,
                ),
                data: { version: this.version },
            });

            if (message.org) {
                this.log.debug(
                    `  Org: ${message.org}, Name: ${message.name}, Version: ${message.version}`,
                );
            }

            if (message.files) {
                for (const file of message.files) {
                    this.log.debug(`  ==> ${JSON.stringify(file)}`);
                }
            }

            this.log.info(
                `Created ${this.type} alias "v${this.alias}" (for "${this.name}") and set it to point to version "${this.version}"`,
            );
        } catch (err) {
            let status = err.statusCode;

            if (status === 409) {
                this.log.debug('Alias already exists, publishing update');

                try {
                    const { message: msg } = await sendCommand({
                        host: this.server,
                        method: 'POST',
                        pathname: join(
                            this.org,
                            this.type,
                            this.name,
                            `v${this.alias}`,
                        ),
                        data: { version: this.version },
                    });

                    if (msg.org) {
                        this.log.debug(
                            `  Org: ${msg.org}, Name: ${msg.name}, Version: ${msg.version}`,
                        );
                    }

                    if (msg.files) {
                        for (const file of msg.files) {
                            this.log.debug(`  ==> ${JSON.stringify(file)}`);
                        }
                    }

                    this.log.info(
                        `Updated ${this.type} alias "v${this.alias}" (for "${this.name}") to point to version "${this.version}"`,
                    );
                    return true;
                } catch (error) {
                    status = error.statusCode;
                }
            }

            this.log.error('Unable to complete alias command');

            switch (status) {
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
                case 409:
                    this.log.warn(
                        `${this.type} with name "${this.name}" and version "${this.version}" already exists on server`,
                    );
                    break;
                case 415:
                    this.log.warn(
                        'Client attempted to send an unsupported file format to server',
                    );
                    break;
                case 502:
                    this.log.warn('Server was unable to write file to storage');
                    break;
                default:
                    this.log.warn('Server failed');
            }

            return false;
        }

        return true;
    }
};
