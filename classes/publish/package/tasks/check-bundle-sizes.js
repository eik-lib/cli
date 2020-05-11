'use strict';

const bytes = require('bytes');
const fs = require('fs');
const { compressedSize } = require('../../../../utils');
const Task = require('./task');

module.exports = class CheckBundleSizes extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { path, js, css } = incoming;
        this.log.debug('Checking bundle file sizes');
        try {
            if (js) {
                const mainIndexJSSize = compressedSize(
                    fs.readFileSync(`${path}/main/index.js`, 'utf8'),
                );
                this.log.debug(
                    `  ==> Main index.js size: ${bytes(mainIndexJSSize)}`,
                );
                const ie11IndexJSSize = compressedSize(
                    fs.readFileSync(`${path}/ie11/index.js`, 'utf8'),
                );
                this.log.debug(
                    `  ==> ie11 index.js size: ${bytes(ie11IndexJSSize)}`,
                );
            }
            if (css) {
                const mainIndexCSSSize = compressedSize(
                    fs.readFileSync(`${path}/main/index.css`, 'utf8'),
                );
                this.log.debug(
                    `  ==> Main index.css size: ${bytes(mainIndexCSSSize)}`,
                );
            }
        } catch (err) {
            throw new Error(`Failed to check bundle sizes: ${err.message}`);
        }

        return outgoing;
    }
};
