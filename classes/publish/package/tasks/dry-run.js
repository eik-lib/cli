/* eslint-disable no-param-reassign */

'use strict';

const Task = require('./task');
const { files: mapfiles } = require('../../../../utils');

module.exports = class DryRun extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { dryRun, path, zipFile, files, cwd } = incoming;
        if (dryRun) {
            outgoing.files = [
                { pathname: path, type: 'temporary directory' },
                { pathname: zipFile, type: 'package archive' },
            ]

            const fls = await mapfiles(files, path, { cwd });

            for (const [, dest] of fls) {
                outgoing.files.push({ pathname: dest, type: 'package file' });
            }
        }

        return outgoing;
    }
};
