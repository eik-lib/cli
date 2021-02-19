/* eslint-disable max-classes-per-file */

'use strict';

const { copyFileSync, writeFileSync } = require('fs');
const { join, isAbsolute, parse } = require('path');
const abslog = require('abslog');
const semver = require('semver');
const mkdir = require('make-dir');
const { schemas, EikConfig } = require('@eik/common');
const { integrity } = require('../utils/http');
const hash = require('../utils/hash');
const { typeSlug } = require('../utils');

module.exports = class Version {
    constructor({
        logger,
        server,
        type = 'package',
        name,
        version,
        level = 'patch',
        cwd,
        map = [],
        out = './.eik',
        files,
    } = {}) {
        const config = new EikConfig(
            {
                server,
                type,
                name,
                version,
                'import-map': map,
                out,
                files,
            },
            null,
            cwd,
        );

        this.log = abslog(logger);
        this.config = config;
        this.path = isAbsolute(config.out) ? config.out : join(cwd, config.out);
        this.level = level;
    }

    async run() {
        const {
            name,
            server,
            type,
            version,
            cwd,
            out,
            files,
            map,
        } = this.config;
        const { log, level, path } = this;
        log.debug('Validating input');

        log.debug(`  ==> config object`);
        this.config.validate();

        log.debug(`  ==> cwd: ${cwd}`);
        parse(cwd);

        log.debug(`  ==> level: ${level}`);
        if (!['major', 'minor', 'patch'].includes(level)) {
            throw new schemas.ValidationError(
                'Parameter "version" is not valid',
            );
        }

        log.debug(`  ==> files: ${JSON.stringify(files)}`);
        if (!files) {
            throw new schemas.ValidationError('Parameter "files" is not valid');
        }

        log.debug(`  ==> map: ${JSON.stringify(map)}`);
        if (!Array.isArray(map)) {
            throw new schemas.ValidationError('Parameter "map" is not valid');
        }

        log.debug('Checking local package version');
        log.debug(`Current local package version determined to be ${version}`);
        log.debug(`Fetching remote package metadata from ${server}`);

        let integrityHash;
        try {
            integrityHash = await integrity(
                server,
                typeSlug(type),
                name,
                version,
            );
        } catch (err) {
            throw new Error(
                `Unable to fetch package metadata from server: ${err.message}`,
            );
        }

        if (!integrityHash) {
            // version does not exist on server yet. No increment needed.
            throw new Error(
                `The current version of this package has not yet been published, version change is not needed.`,
            );
        }

        log.debug('Hashing local files for comparison with server');

        let localHash;
        try {
            mkdir.sync(path);
            const eikPathDest = join(path, './eik.json');
            const eikJSON = {
                name,
                server,
                files,
                'import-map': map,
                out,
            };
            writeFileSync(eikPathDest, JSON.stringify(eikJSON, null, 2));

            const localFiles = [eikPathDest];
            log.debug(`  ==> ${eikPathDest}`);

            if (files) {
                try {
                    const mappings = await this.config.pathsAndFilesAbsolute();

                    for (const [src, dest] of mappings) {
                        copyFileSync(src, dest);
                        log.debug(`  ==> ${dest}`);
                        localFiles.push(dest);
                    }
                } catch (err) {
                    // throw new Error(`Failed to zip JavaScripts: ${err.message}`);
                }
            }
            localHash = await hash.files(localFiles);
        } catch (err) {
            throw new Error(
                `Unable to hash local files for comparison: ${err.message}`,
            );
        }

        log.debug(`Comparing hashes:`);
        log.debug(`  ==> local: ${localHash}`);
        log.debug(`  ==> remote: ${integrityHash}`);
        const same = hash.compare(integrityHash, localHash);

        if (same) {
            throw new Error(
                `The current version of this package already contains these files, version change is not needed.`,
            );
        }

        log.debug(`Incrementing by "${level}" level`);
        const newVersion = semver.inc(version, level);
        log.debug(`  ==> ${newVersion}`);
        return newVersion;
    }
};
