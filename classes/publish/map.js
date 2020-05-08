'use strict';

const assert = require('assert');
const abslog = require('abslog');
const { join, parse, isAbsolute } = require('path');
const { existsSync } = require('fs');
const { validators } = require('@eik/common');
const { sendCommand } = require('../../utils');

module.exports = class PublishMap {
    constructor({
        logger,
        cwd = process.cwd(),
        server,
        token,
        file,
        name,
        version,
    } = {}) {
        this.log = abslog(logger);
        this.cwd = cwd;
        this.server = server;
        this.token = token;
        this.name = name;
        this.version = version;
        this.file = file;
    }

    async run() {
        this.log.debug('Running import map publish command');
        this.log.debug('Validating input');

        parse(this.cwd);
        validators.origin(this.server);
        assert(
            this.token && typeof this.token === 'string',
            'Parameter "token" is not valid',
        );
        validators.name(this.name);
        validators.version(this.version);
        parse(this.file);

        this.absoluteFile = isAbsolute(this.file)
            ? this.file
            : join(this.cwd, this.file);

        assert(
            existsSync(this.absoluteFile),
            'Parameter "file" is not valid. File does not exist',
        );

        this.log.debug(
            `Uploading import map "${this.name}" version "${this.version}" to asset server`,
        );
        try {
            await sendCommand({
                method: 'PUT',
                host: this.server,
                pathname: join('map', this.name, this.version),
                map: this.absoluteFile,
                token: this.token,
            });

            return {
                server: this.server,
                name: this.name,
                version: this.version,
                type: 'map',
            };
        } catch (err) {
            const msg = 'Unable to complete upload of import map to server';
            switch (err.statusCode) {
                case 400:
                    throw new Error(
                        `${msg}: Client attempted to send an invalid URL parameter`,
                    );
                case 401:
                    throw new Error(`${msg}: Client unauthorized with server`);
                case 409:
                    throw new Error(
                        `${msg}: Map with name "${this.name}" and version "${this.version}" already exists on server`,
                    );
                case 415:
                    throw new Error(
                        `${msg}: Client attempted to send an unsupported file format to server`,
                    );
                case 502:
                    throw new Error(
                        `${msg}: Server was unable to write file to storage`,
                    );
                default:
                    throw new Error(`${msg}: Server failed`);
            }
        }
    }
};
