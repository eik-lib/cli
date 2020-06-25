'use strict';

const { join, isAbsolute } = require('path');
const bytes = require('bytes');
const fs = require('fs');
const { compressedSize } = require('../../../../utils');
const Task = require('./task');

module.exports = class CheckBundleSizes extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { js, css, cwd } = incoming;
        this.log.debug('Checking bundle file sizes');
        try {
            if (js) {
                const path = isAbsolute(js) ? js : join(cwd, js);
                const jsEntrypointFile = compressedSize(
                    fs.readFileSync(path, 'utf8'),
                );
                this.log.debug(
                    `  ==> JavaScript entrypoint size: ${bytes(
                        jsEntrypointFile,
                    )}`,
                );
            }
            if (css) {
                const path = isAbsolute(css) ? css : join(cwd, css);
                const cssEntrypointFile = compressedSize(
                    fs.readFileSync(path, 'utf8'),
                );
                this.log.debug(
                    `  ==> CSS entrypoint size: ${bytes(
                        cssEntrypointFile,
                    )}`,
                );
            }
        } catch (err) {
            throw new Error(`Failed to check bundle sizes: ${err.message}`);
        }

        return outgoing;
    }
};
