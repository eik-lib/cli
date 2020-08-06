/* eslint-disable no-param-reassign */

'use strict';

const {join} = require('path');
const Task = require('./task');

module.exports = class DryRun extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { dryRun, path, zipFile, entrypoints } = incoming;
        if (dryRun) {
            outgoing.files = [
                { pathname: path, type: 'temporary directory' },
                { pathname: zipFile, type: 'package archive' },
            ]

            for (const key of Object.keys(entrypoints)) {
                outgoing.files.push({ pathname: join(path, key), type: 'package file' })
            }
        }

        return outgoing;
    }
};
