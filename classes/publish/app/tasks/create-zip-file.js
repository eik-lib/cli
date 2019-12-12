'use strict';

const { join } = require('path');
const tar = require('tar');

module.exports = class CreateZipFile {
    async process(state = {}) {
        const { log, js, css, path } = state;

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
            state.zipFile = join(path, `archive.tgz`);

            await tar.c(
                {
                    gzip: true,
                    file: state.zipFile,
                    cwd: path,
                },
                filesToZip,
            );
        } catch (err) {
            throw new Error(`Unable to create zip file: ${err.message}`);
        }

        return state;
    }
};
