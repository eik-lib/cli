/* eslint-disable no-param-reassign */

'use strict';

const { join } = require('path');
const { fetchPackageMeta } = require('../../../../utils');
const hash = require('../../../../utils/hash');
const Task = require('./task');

module.exports = class CheckIfAlreadyPublished extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { server, name, version, js, css, path } = incoming;

        log.debug(`Checking for existence of package ${name} version ${version}`);
        log.debug('  ==> Fetching package metadata from server');

        // TODO: version needs to be the previous version. How can we get this?
        try {
            if (await fetchPackageMeta(server, name, version)) {
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
        
        let meta;
        try {
            meta = await fetchPackageMeta(server, name);
        } catch (err) {
            throw new Error(
                `Unable to fetch package metadata from server: ${err.message}`,
            );
        }

        if (!meta) {
            log.debug('  ==> Package has never been published');
            return outgoing;
        }

        log.debug(`  ==> However, previous versions of package do exist`);
        log.debug('  ==> Checking if local files have changed');

        let localHash;
        try {
            const localFiles = [join(path, './eik.json')];
            if (js) {
                for (const key of Object.keys(js)) {
                    localFiles.push(join(path, key));
                }
            }
            if (css) {
                for (const key of Object.keys(css)) {
                    localFiles.push(join(path, key));
                }
            }
            localHash = await hash.files(localFiles);
        } catch (err) {
            throw new Error(
                `Unable to hash local files for comparison: ${err.message}`,
            );
        }

        const versions = new Map(meta.versions);
        for (const v of versions.values()) {
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
