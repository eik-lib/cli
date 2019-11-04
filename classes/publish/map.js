'use strict';

const abslog = require('abslog');
const { join, parse } = require('path');
const { existsSync } = require('fs');
const { validators } = require('@asset-pipe/common');
const { sendCommand } = require('../../utils');

module.exports = class PublishMap {
    constructor({
        logger,
        cwd = process.cwd(),
        server,
        org,
        file,
        name,
        version
    } = {}) {
        this.log = abslog(logger);
        this.cwd = cwd;
        this.server = server;
        this.org = org;
        this.name = name;
        this.version = version;
        this.file = file;
    }

    async run() {
        this.log.debug('Running import map publish command');

        this.log.debug('Validating input');
        try {
            parse(this.cwd);
        } catch (err) {
            this.log.error('Parameter "cwd" is not valid');
            return false;
        }

        try {
            validators.origin(this.server);
        } catch (err) {
            this.log.error(`Parameter "server" is not valid`);
            return false;
        }

        try {
            validators.org(this.org);
            validators.name(this.name);
            validators.version(this.version);
        } catch (err) {
            this.log.error(err.message);
            return false;
        }

        try {
            parse(this.file);
        } catch (err) {
            this.log.error('Parameter "file" is not valid');
            return false;
        }

        if (!existsSync(join(this.cwd, this.file))) {
            this.log.error(
                'Parameter "file" is not valid. File does not exist'
            );
            return false;
        }

        this.log.debug(
            `Uploading import map "${this.name}" version "${this.version}" to asset server`
        );
        try {
            await sendCommand({
                method: 'PUT',
                host: this.server,
                pathname: join(this.org, 'map', this.name, this.version),
                map: join(this.cwd, this.file)
            });
        } catch (err) {
            this.log.error('Unable to complete upload of import map to server');
            this.log.warn(err.message);
            return false;
        }

        this.log.debug('Import map publish command complete');
        return true;
    }
};