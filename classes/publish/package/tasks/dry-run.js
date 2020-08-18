/* eslint-disable no-param-reassign */

'use strict';

const Task = require('./task');
const { entrypoints: mapEntrypoints } = require('../../../../utils');

module.exports = class DryRun extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { dryRun, path, zipFile, entrypoints, cwd } = incoming;
        if (dryRun) {
            outgoing.files = [
                { pathname: path, type: 'temporary directory' },
                { pathname: zipFile, type: 'package archive' },
            ]

            const files = await mapEntrypoints(entrypoints, path, { cwd });

            for (const [, dest] of files) {
                outgoing.files.push({ pathname: dest, type: 'package file' });
            }
        }

        return outgoing;
    }
};
