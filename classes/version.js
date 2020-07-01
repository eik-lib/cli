'use strict';

const { copyFileSync, writeFileSync } = require('fs');
const { join, isAbsolute } = require('path');
const abslog = require('abslog');
const semver = require('semver');
// const { validators } = require('@eik/common');
const {
    fetchPackageMeta,
    calculateFilesHash,
    compareHashes,
} = require('../utils');

module.exports = class Ping {
    constructor({
        logger,
        server,
        name,
        version,
        level = 'patch',
        cwd,
        js,
        css,
        map,
        out = './.eik',
    } = {}) {
        this.log = abslog(logger);
        this.server = server;
        this.name = name;
        this.version = version;
        this.level = level;
        this.cwd = cwd;
        this.js = js;
        if (typeof js === 'string') {
            this.js = {
                './index.js': js,
            };
        }
        this.css = css;
        if (typeof css === 'string') {
            this.css = {
                './index.css': css,
            };
        }
        this.map = map;
        this.out = out;
        this.path = isAbsolute(out) ? out : join(cwd, out);
    }

    async run() {
        // TODO: validate input
        // version exists and is semver
        // server is a url
        // js or css files exist
        // name is a string
        // level is major, minor or patch

        const { log, server, name, version, level, cwd, js, css, map, path, out } = this;
        
        log.debug('Checking package version');
        log.debug(`Current package determined to be ${version}`);
        log.debug('Fetching package metadata from server.');

        let meta;
        try {
            meta = await fetchPackageMeta(server, name, version);
        } catch (err) {
            throw new Error(
                `Unable to fetch package metadata from server: ${err.message}`,
            );
        }

        if (!meta) {
            // version does not exist on server yet. No increment needed.
            throw new Error(
                `The current version of this package has not yet been published, version change is not needed.`,
            );
        }

        log.debug('Hashing local files for comparison with server');

        let localHash;
        try {
            const eikPathDest = join(path, './eik.json');
            const eikJSON = {
                name,
                server,
                js,
                css,
                'import-map': map,
                out,
            };
            writeFileSync(eikPathDest, JSON.stringify(eikJSON, null, 2));

            const localFiles = [ eikPathDest ];
            log.debug(`  ==> ${eikPathDest}`);

            if (js) {
                try {
                    for (const [key, val] of Object.entries(js)) {
                        const src = isAbsolute(val) ? val : join(cwd, val);
                        const dest = join(path, key);
                        copyFileSync(src, dest);
                        log.debug(`  ==> ${dest}`);
                        localFiles.push(dest);
                    }
                } catch (err) {
                    // throw new Error(`Failed to zip JavaScripts: ${err.message}`);
                }
            }
            if (css) {
                try {
                    for (const [key, val] of Object.entries(css)) {
                        const src = isAbsolute(val) ? val : join(cwd, val);
                        const dest = join(path, key);
                        copyFileSync(src, dest);
                        log.debug(`  ==> ${dest}`);
                        localFiles.push(join(path, key));
                    }
                } catch (err) {
                    // throw new Error(`Failed to zip CSS: ${err.message}`);
                }
            }
            
            localHash = await calculateFilesHash(localFiles);
        } catch (err) {
            throw new Error(
                `Unable to hash local files for comparison: ${err.message}`,
            );
        }

        log.debug(`Comparing hashes:`)
        log.debug(`  ==> local: ${localHash}`);
        log.debug(`  ==> remote: ${meta.integrity}`);
        const same = compareHashes(meta.integrity, localHash);

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
