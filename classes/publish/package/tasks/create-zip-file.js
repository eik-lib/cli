'use strict';

const { copyFileSync, writeFileSync } = require('fs');
const { join, isAbsolute, basename } = require('path');
const tar = require('tar');
const Task = require('./task');

module.exports = class CreateZipFile extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { js, css, path, name, map, server, out, cwd } = incoming;

        log.debug(`Creating zip file`);
        log.debug(`  ==> ${join(path, `eik.tgz`)}`);

        const filesToZip = [];

        try {
            const eikPathDest = join(path, './eik.json');
            writeFileSync(eikPathDest, JSON.stringify({
                name,
                server,
                js,
                css,
                'import-map': map,
                out,
            }, null, 2));
            filesToZip.push(basename(eikPathDest));
        } catch (err) {
            throw new Error(`Failed to zip eik.json file: ${err.message}`);
        }

        if (js) {
            try {
                for (const [key, val] of Object.entries(js)) {
                    const jsPathSrc = isAbsolute(val) ? val : join(cwd, val);
                    copyFileSync(jsPathSrc, join(path, key));
                    filesToZip.push(key);
                }
            } catch (err) {
                throw new Error(`Failed to zip JavaScripts: ${err.message}`);
            }
        }

        if (css) {
            try {
                for (const [key, val] of Object.entries(css)) {
                    const cssPathSrc = isAbsolute(val) ? val : join(cwd, val);
                    copyFileSync(cssPathSrc, join(path, key));
                    filesToZip.push(key);
                }
            } catch (err) {
                throw new Error(`Failed to zip CSS: ${err.message}`);
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
