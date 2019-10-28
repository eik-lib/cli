'use strict';

const abslog = require('abslog');
const { sendCommand } = require('../utils');
const v = require('../validators');

module.exports = class Version {
    constructor({ logger, server, org, name, alias, version } = {}) {
        this.log = abslog(logger);
        this.server = server;
        this.org = org;
        this.name = name;
        this.alias = alias;
        this.version = version;
    }

    async run() {
        this.log.debug('Validating input');

        if (v.version.validate(this.version).error) {
            this.log.error(`Invalid 'semver' range given`);
            return false;
        }

        if (v.alias.validate(this.alias).error) {
            this.log.error(`Invalid 'alias' name given`);
            return false;
        }

        if (v.name.validate(this.name).error) {
            this.log.error(`Invalid 'name' specified`);
            return false;
        }

        this.log.debug('Requesting alias creation from asset server');
        try {
            const messages = await sendCommand({
                host: this.server,
                method: 'PUT',
                pathname: `/${this.org}/pkg/${this.name}/v${this.alias}`,
                data: { version: this.version }
            });

            messages.forEach(msg => {
                this.log.debug(`  ==> ${JSON.stringify(msg)}`);
            });
        } catch (err) {
            this.log.error('Unable to complete alias command');
            this.log.warn(err.message);

            return false;
        }

        return true;
    }
};
