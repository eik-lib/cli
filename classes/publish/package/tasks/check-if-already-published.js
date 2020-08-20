/* eslint-disable no-param-reassign */

'use strict';

const { join } = require('path');
const { integrity, versions } = require('../../../../utils/http');
const hash = require('../../../../utils/hash');
const Task = require('./task');
const { files: mapfiles } = require('../../../../utils');

module.exports = class CheckIfAlreadyPublished extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { server, name, version, files, path, cwd } = incoming;

        log.debug(`Checking for existence of package ${name} version ${version}`);
        log.debug('  ==> Fetching package metadata from server');

        // TODO: version needs to be the previous version. How can we get this?
        try {
            if (await integrity(server, name, version)) {
                throw new Error(
                    `${name} version ${version} already exists on the Eik server. Publishing is not necessary.`,
                );
            }
            log.debug(`  ==> Package version ${version} does not yet exist`);
        } catch(err) {
            throw new Error(
                `Unable to fetch package metadata from server: ${err.message}`,
            );
        }
        
        let pkgVersions;
        try {
            pkgVersions = await versions(server, name);
        } catch (err) {
            throw new Error(
                `Unable to fetch package metadata from server: ${err.message}`,
            );
        }

        if (!pkgVersions) {
            log.debug('  ==> Package has never been published');
            return outgoing;
        }

        log.debug(`  ==> However, previous versions of package do exist`);
        log.debug('  ==> Checking if local files have changed');

        let localHash;
        try {
            const localFiles = [join(path, './eik.json')];
            if (files) {
                const mappings = await mapfiles(files, path, {
                    cwd,
                });

                for (const [, dest] of mappings) {
                    localFiles.push(dest);
                }
            }
            localHash = await hash.files(localFiles);
        } catch (err) {
            throw new Error(
                `Unable to hash local files for comparison: ${err.message}`,
            );
        }

        const versionMap = new Map(pkgVersions);
        for (const v of versionMap.values()) {
            const same = hash.compare(v.integrity, localHash);
            if (same) {
                throw new Error(
                    `Version ${v.version} of this package already contains these files, publishing is not necessary.`,
                );
            }
            log.debug('  ==> New files do not match existing files, continue with publishing');
        }

        outgoing.integrity = localHash;

        return outgoing;
    }
};
