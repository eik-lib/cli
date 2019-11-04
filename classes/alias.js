'use strict';

const abslog = require('abslog');
const { join } = require('path');
const { validators } = require('@asset-pipe/common');
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
            const message = await sendCommand({
                host: this.server,
                method: 'PUT',
                pathname: join(
                    this.org,
                    this.type,
                    this.name,
                    `v${this.alias}`
                ),
                data: { version: this.version }
            });

            this.log.debug(
                `  Org: ${message.org}, Name: ${message.name}, Version: ${message.version}`
            );
            for (const file of message.files) {
                this.log.debug(`  ==> ${JSON.stringify(file)}`);
            }
        } catch (err) {
            this.log.error('Unable to complete alias command');
            this.log.warn(err.message);

            return false;
        }

        return true;
    }
};