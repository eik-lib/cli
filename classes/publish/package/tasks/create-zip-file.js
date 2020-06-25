'use strict';

const { copyFileSync, readFileSync, writeFileSync } = require('fs');
const { join, isAbsolute, basename } = require('path');
const tar = require('tar');
const Task = require('./task');

module.exports = class CreateZipFile extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { js, css, path, cwd } = incoming;

        log.debug('Creating zip file');

        const filesToZip = [];

        try {
            const eikPathSrc = join(cwd, './eik.json');
            const eikPathDest = join(path, './eik.json');
            const eikrc = JSON.parse(readFileSync(eikPathSrc, 'utf8'));
            // remove version field to avoid non determinism
            delete eikrc.version;
            writeFileSync(eikPathDest, JSON.stringify(eikrc, null, 2));
            filesToZip.push(basename(eikPathDest));
        } catch (err) {
            throw new Error(`Failed to zip eik.json file: ${err.message}`);
        }

        if (js) {
            try {
                const jsPathSrc = isAbsolute(js) ? js : join(cwd, js);
                const jsPathDest = join(path, basename(js));
                copyFileSync(jsPathSrc, jsPathDest);
                filesToZip.push(basename(jsPathDest));
            } catch (err) {
                throw new Error(`Failed to zip JavaScripts: ${err.message}`);
            }
        }

        if (css) {
            try {
                const cssPathSrc = isAbsolute(css) ? css : join(cwd, css);
                const cssPathDest = join(path, basename(css));
                copyFileSync(cssPathSrc, cssPathDest);
                filesToZip.push(basename(cssPathDest));
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
