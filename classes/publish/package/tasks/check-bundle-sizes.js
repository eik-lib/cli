/* eslint-disable no-await-in-loop */

'use strict';

const { join, isAbsolute } = require('path');
const bytes = require('bytes');
const fs = require('fs');
const gzipSize = require('gzip-size');
const glob = require('glob');
const Task = require('./task');

module.exports = class CheckBundleSizes extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { files, cwd } = incoming;
        this.log.debug('Checking bundle file sizes');
        try {
            if (files) {
                for (const [key, val] of Object.entries(files)) {
                    const path = isAbsolute(val) ? val : join(cwd, val);

                    const fls = await new Promise((resolve, reject) =>
                        glob(path, (err, f) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve(f);
                        }),
                    );

                    for (const file of fls) {
                        this.log.debug(
                            `  ==> entrypoint size (${key} => ${file}): ${bytes(
                                gzipSize.sync(fs.readFileSync(file, 'utf8')),
                            )}`,
                        );
                    }
                }
            }
        } catch (err) {
            throw new Error(`Failed to check bundle sizes: ${err.message}`);
        }

        return outgoing;
    }
};
