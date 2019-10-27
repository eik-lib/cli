'use strict';

const abslog = require('abslog');
const { join } = require('path');
const { sendCommand } = require('../../utils');
const v = require('../../validators');

module.exports = class Publish {
    constructor({
        logger,
        cwd = process.cwd(),
        server,
        org,
        file,
        name,
        version
        // dryRun = false
    } = {}) {
        this.log = abslog(logger);
        this.cwd = cwd;
        this.server = server;
        this.org = org;
        this.file = file;
        this.name = name;
        this.version = version;
        // this.dryRun = dryRun;
        // this.path = join(tempDir, `map-${name}-${version}`);
    }

    async run() {
        this.log.debug('Validating input');

        if (v.name.validate(this.name).error) {
            this.log.error(`Invalid or missing 'name' argument specified`);
            return;
        }

        if (v.version.validate(this.version).error) {
            this.log.error(`Invalid or missing 'version' argument specified`);
            return;
        }

        if (v.organisation.validate(this.org).error) {
            this.log.error(`Invalid or missing 'org' field specified`);
            return;
        }

        if (v.server.validate(this.server).error) {
            this.log.error(`Invalid or missing 'server' field specified`);
            return;
        }

        this.log.debug(
            `Uploading import map "${this.name}" "${this.version}" to asset server`
        );

        try {
            const messages = await sendCommand({
                method: 'PUT',
                host: this.server,
                pathname: `/${this.org}/map/${this.name}/${this.version}`,
                map: join(this.cwd, this.file)
            });

            messages.forEach(msg => {
                this.log.debug(`  ==> ${JSON.stringify(msg)}`);
            });
        } catch (err) {
            this.log.error('Unable to complete upload of import map to server');
            this.log.warn(err.message);
            return;
        }

        this.log.info(`✨ Done ✨`);
    }
};
