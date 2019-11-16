'use strict';

const abslog = require('abslog');
const semver = require('semver');
const fs = require('fs');
const { schemas, validators } = require('@eik/common');
const { resolvePath } = require('../utils');

module.exports = class Version {
    constructor({ logger, cwd = process.cwd(), level } = {}) {
        this.log = abslog(logger);
        this.pathname = resolvePath('./assets.json', cwd).pathname;
        this.level = level;
    }

    async run() {
        this.log.debug('Running version command');

        this.log.debug('Validating input');
        try {
            validators.semverType(this.level);
        } catch (err) {
            this.log.error(
                `Invalid 'semver' type. Valid types are "major", "minor" and "patch"`,
            );
            return false;
        }

        this.log.debug('Reading assets.json file');
        try {
            this.assets = JSON.parse(fs.readFileSync(this.pathname));
        } catch (err) {
            this.log.error('Failed to read assets.json. Does file exist?');
            this.log.warn(err.message);
            return false;
        }

        const result = schemas.assets(this.assets);
        if (result.error) {
            this.log.error(`Invalid 'assets.json' file`);
            for (const { dataPath, message } of result.error) {
                this.log.warn(`${dataPath} ${message}`);
            }

            return false;
        }

        this.log.debug('Updating assets.json version field');
        try {
            this.oldVersion = this.assets.version;
            this.assets.version = semver.inc(this.assets.version, this.level);
        } catch (err) {
            this.log.error('Failed to update "assets.version"');
            this.log.warn(err.message);

            return false;
        }

        this.log.debug('Saving updated "assets.json" file');
        try {
            fs.writeFileSync(
                this.pathname,
                JSON.stringify(this.assets, null, 2),
            );
        } catch (err) {
            this.log.error('Unable to save "assets.json" file back to disk');
            this.log.warn(err.message);

            return false;
        }

        this.log.info(
            `Updated version field of "assets.json" file from "${this.oldVersion}" to "${this.assets.version}"`,
        );
        return true;
    }
};
