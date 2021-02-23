/* eslint-disable no-await-in-loop */

'use strict';

const bytes = require('bytes');
const fs = require('fs');
const gzipSize = require('gzip-size');
const Task = require('./task');

module.exports = class CheckBundleSizes extends Task {
    async process() {
        this.log.debug('Checking bundle file sizes');
        try {
            for (const mapping of await this.config.mappings()) {
                const file = mapping.source.absolute;
                this.log.debug(
                    `  ==> entrypoint size (${
                        mapping.source.destination
                    } => ${file}): ${bytes(
                        gzipSize.sync(fs.readFileSync(file, 'utf8')),
                    )}`,
                );
            }
        } catch (err) {
            throw new Error(`Failed to check bundle sizes: ${err.message}`);
        }
    }
};
