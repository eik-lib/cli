'use strict';

const { copyFileSync, writeFileSync } = require('fs');
const { join, isAbsolute, basename } = require('path');
const tar = require('tar');
const Task = require('./task');

module.exports = class CreateZipFile extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { entrypoints, path, name, map, server, out, cwd } = incoming;

        log.debug(`Creating zip file`);
        log.debug(`  ==> ${join(path, `eik.tgz`)}`);

        const filesToZip = [];

        try {
            const eikPathDest = join(path, './eik.json');
            writeFileSync(eikPathDest, JSON.stringify({
                name,
                server,
                entrypoints,
                'import-map': map,
                out,
            }, null, 2));
            filesToZip.push(basename(eikPathDest));
        } catch (err) {
            throw new Error(`Failed to zip eik.json file: ${err.message}`);
        }

        if (entrypoints) {
            try {
                for (const [key, val] of Object.entries(entrypoints)) {
                    const pathSrc = isAbsolute(val) ? val : join(cwd, val);
                    copyFileSync(pathSrc, join(path, key));
                    filesToZip.push(key);
                }
            } catch (err) {
                throw new Error(`Failed to copy files for zipping: ${err.message}`);
            }
        }

        try {
            // eslint-disable-next-line no-param-reassign
            incoming.zipFile = join(path, `eik.tgz`);

            await tar.c(
                {
                    gzip: true,
                    file: incoming.zipFile,
                    cwd: path,
                },
                filesToZip,
            );
        } catch (err) {
            throw new Error(`Unable to create zip file: ${err.message}`);
        }

        return outgoing;
    }
};
