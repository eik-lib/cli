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
        const { server, name, version, path, js, css } = incoming;

        log.debug('Fetching package metadata from server.');

        if (!version) return incoming;

        let meta;
        try {
            meta = await fetchPackageMeta(server, name, version);
        } catch (err) {
            throw new Error(
                `Unable to fetch package metadata from server: ${err.message}`,
            );
        }

        if (!meta) return outgoing;

        log.debug('Hashing local files for comparison with server');

        let localHash;
        try {
            const localFiles = [];
            if (js) {
                localFiles.push(
                    join(path, 'main', 'index.js'),
                    join(path, 'main', 'index.js.map'),
                    join(path, 'ie11', 'index.js'),
                    join(path, 'ie11', 'index.js.map'),
                );
            }
            if (css) {
                localFiles.push(
                    join(path, 'main', 'index.css'),
                    join(path, 'main', 'index.css.map'),
                );
            }
            localHash = await calculateFilesHash(localFiles);
        } catch (err) {
            throw new Error(
                `Unable to hash local files for comparison: ${err.message}`,
            );
        }

        const same = compareHashes(meta.integrity, localHash);

        if (same) {
            throw new Error(
                `The current version of this package already contains these files, publishing is not necessary.`,
            );
        }

        outgoing.integrity = localHash;

        return outgoing;
    }
};
