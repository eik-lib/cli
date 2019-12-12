'use strict';

const { join } = require('path');
const {
    compareHashes,
    fetchPackageMeta,
    calculateFilesHash,
} = require('../../../../utils');

module.exports = class CheckIfAlreadyPublished {
    async process(state = {}) {
        const { log, server, org, name, currentVersion, path, js, css } = state;

        log.debug('Fetching package metadata from server.');

        if (!currentVersion) return state;

        let meta;
        try {
            meta = await fetchPackageMeta(server, org, name, currentVersion);
        } catch (err) {
            throw new Error(
                `Unable to fetch package metadata from server: ${err.message}`,
            );
        }

        if (!meta) return state;

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
            // eslint-disable-next-line no-param-reassign
            state.integrity = localHash;
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

        return state;
    }
};
