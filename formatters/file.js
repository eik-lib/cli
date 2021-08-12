/* eslint-disable no-restricted-properties */
/* eslint-disable prefer-template */
/* eslint-disable one-var */
/* eslint-disable no-underscore-dangle */

'use strict';

const { join } = require('path');
const chalk = require('chalk');

function readableBytes(bytes) {
    const i = Math.floor(Math.log(bytes) / Math.log(1024)),
        sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + sizes[i];
}

class File {
    constructor({
        pathname = '',
        mimeType = '',
        size = null,
        integrity = '',
    } = {}) {
        this.pathname = pathname;
        this.mimeType = mimeType;
        this.size = size;
        this.integrity = integrity;
    }

    format(baseURL = '') {
        const write = process.stdout.write.bind(process.stdout);
        const url = new URL(baseURL);

        const fileUrl = new URL(join(url.pathname, this.pathname), url.origin);
        write(`     - ${chalk.cyan(fileUrl.href)} `);
        write(`${chalk.yellow(this.mimeType)} `);
        write(`${chalk.magenta(readableBytes(this.size))}\n`);
        write(`       ${chalk.bold('integrity:')} ${this.integrity}\n`);
    }
}

module.exports = File;
