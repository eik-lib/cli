/* eslint-disable no-param-reassign */

'use strict';

const Task = require('./task');

module.exports = class DryRun extends Task {
    async process(zipFile) {
        const { path } = this;

        const files = [
            { pathname: path, type: 'temporary directory' },
            { pathname: zipFile, type: 'package archive' },
        ];

        const fls = await this.config.pathsAndFilesAbsolute();

        for (const [, dest] of fls) {
            files.push({ pathname: dest, type: 'package file' });
        }

        return files;
    }
};
