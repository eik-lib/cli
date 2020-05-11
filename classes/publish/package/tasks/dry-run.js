/* eslint-disable no-param-reassign */

'use strict';

module.exports = class DryRun {
    async process(incoming = {}, outgoing = {}) {
        const { dryRun, path, zipFile } = incoming;
        if (dryRun) {
            outgoing.files = [
                { pathname: path, type: 'temporary directory' },
                { pathname: zipFile, type: 'package archive' },
                { pathname: `${path}/main/index.js`, type: 'package file' },
                { pathname: `${path}/main/index.js.map`, type: 'package file' },
                { pathname: `${path}/ie11/index.js`, type: 'package file' },
                { pathname: `${path}/ie11/index.js.map`, type: 'package file' },
                { pathname: `${path}/main/index.css`, type: 'package file' },
                { pathname: `${path}/main/index.css.map`, type: 'package file' },
            ]
        }

        return outgoing;
    }
};
