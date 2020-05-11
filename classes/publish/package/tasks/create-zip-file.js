'use strict';

const { join } = require('path');
const tar = require('tar');
const Task = require('./task');

module.exports = class CreateZipFile extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { js, css, path } = incoming;

        log.debug('Creating zip file');

        const filesToZip = [];
        if (js) {
            filesToZip.push(
                `main/index.js`,
                `main/index.js.map`,
                `ie11/index.js`,
                `ie11/index.js.map`,
            );
        }

        if (css) {
            filesToZip.push(`main/index.css`, `main/index.css.map`);
        }

        try {
            // eslint-disable-next-line no-param-reassign
            incoming.zipFile = join(path, `archive.tgz`);

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
