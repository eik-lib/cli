'use strict';

const { join, isAbsolute } = require('path');
const bytes = require('bytes');
const fs = require('fs');
const gzipSize = require('gzip-size');
const Task = require('./task');

module.exports = class CheckBundleSizes extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { js, css, cwd } = incoming;
        this.log.debug('Checking bundle file sizes');
        try {
            if (js) {
                for (const [key, val] of Object.entries(js)) {
                    const path = isAbsolute(val) ? val : join(cwd, val);
                    const jsEntrypointFile = gzipSize.sync(
                        fs.readFileSync(path, 'utf8'),
                    );
                    this.log.debug(
                        `  ==> JavaScript entrypoint size (${key} => ${val}): ${bytes(
                            jsEntrypointFile,
                        )}`,
                    );
                }
            }
            if (css) {
                for (const [key, val] of Object.entries(css)) {
                    const path = isAbsolute(val) ? val : join(cwd, val);
                    const cssEntrypointFile = gzipSize.sync(
                        fs.readFileSync(path, 'utf8'),
                    );
                    this.log.debug(
                        `  ==> CSS entrypoint size (${key} => ${val}): ${bytes(
                            cssEntrypointFile,
                        )}`,
                    );
                }
            }
        } catch (err) {
            throw new Error(`Failed to check bundle sizes: ${err.message}`);
        }

        return outgoing;
    }
};
