'use strict';

const assert = require('assert');
const abslog = require('abslog');
const { join } = require('path');
const { schemas, validators } = require('@eik/common');
const { request } = require('../utils/http');
const { typeSlug } = require('../utils');

module.exports = class Alias {
    constructor({ logger, server, token, type, name, version, alias } = {}) {
        this.log = abslog(logger);
        this.server = server;
        this.token = token;
        this.type = typeSlug(type);
        this.name = name;
        this.alias = alias;
        this.version = version;
    }

    async run() {
        const data = {
            server: this.server,
            type: this.type,
            name: this.name,
            alias: this.alias,
            version: this.version,
            update: false,
            files: [],
            org: '',
            integrity: '',
        };

        this.log.debug('Validating command input');
        schemas.assert.server(this.server);
        schemas.assert.name(this.name);
        schemas.assert.version(this.version);
        validators.type(this.type);
        validators.alias(this.alias);
        assert(
            this.token && typeof this.token === 'string',
            `Parameter "token" is not valid`,
        );

        this.log.debug(
            `Requesting creation of ${this.type} alias "v${this.alias}" for ${this.name} v${this.version} on ${this.server}`,
        );
        try {
            const { message } = await request({
                host: this.server,
                method: 'PUT',
                pathname: join(this.type, this.name, `v${this.alias}`),
                data: { version: this.version },
                token: this.token,
            });

            data.org = message.org || '';
            data.integrity = message.integrity || '';
            data.version = message.version || this.version;
            data.name = message.name || this.name;
            data.files = message.files || [];

            return data;
        } catch (err) {
            let status = err.statusCode;

            if (status === 409) {
                this.log.debug(
                    'Alias already exists on server, performing update',
                );

                try {
                    const { message: msg } = await request({
                        host: this.server,
                        method: 'POST',
                        pathname: join(this.type, this.name, `v${this.alias}`),
                        data: { version: this.version },
                        token: this.token,
                    });

                    data.org = msg.org || '';
                    data.integrity = msg.integrity || '';
                    data.version = msg.version || this.version;
                    data.name = msg.name || this.name;
                    data.files = msg.files || [];
                    data.update = true;

                    return data;
                } catch (error) {
                    status = error.statusCode;
                }
            }

            switch (status) {
                case 400:
                    throw new Error(
                        'Client attempted to send an invalid URL parameter',
                    );
                case 401:
                    throw new Error('Client unauthorized with server');
                case 404:
                    throw new Error(
                        'The server was unable to locate the required resource',
                    );
                case 409:
                    throw new Error(
                        `${this.type} with name "${this.name}" and version "${this.version}" already exists on server`,
                    );
                case 415:
                    throw new Error(
                        'Client attempted to send an unsupported file format to server',
                    );
                case 502:
                    throw new Error(
                        'Server was unable to write file to storage',
                    );
                default:
                    throw new Error('Server failure');
            }
        }
    }
};
