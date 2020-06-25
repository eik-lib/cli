/* eslint-disable no-param-reassign */

'use strict';

const { join } = require('path');
const {
    compareHashes,
    fetchPackageMeta,
    calculateFilesHash,
} = require('../../../../utils');
const Task = require('./task');

module.exports = class CheckIfAlreadyPublished extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { server, name, version, js, css, path } = incoming;

        log.debug('Fetching package metadata from server.');

        // TODO: version needs to be the previous version. How can we get this?
        try {
            if (await fetchPackageMeta(server, name, version)) {
                throw new Error(
                    `${name} version ${version} already exists on the Eik server. Publishing is not necessary.`,
                );
            }
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

        if (!meta) return outgoing;

        log.debug('Hashing local files for comparison with server');

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
            localHash = await calculateFilesHash(localFiles);
        } catch (err) {
            throw new Error(
                `Unable to hash local files for comparison: ${err.message}`,
            );
        }

        const versions = new Map(meta.versions);
        for (const v of versions.values()) {
            const same = compareHashes(v.integrity, localHash);
            if (same) {
                throw new Error(
                    `Version ${v.version} of this package already contains these files, publishing is not necessary.`,
                );
            }
        }

        outgoing.integrity = localHash;

        return outgoing;
    }
};
