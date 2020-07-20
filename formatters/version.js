/* eslint-disable no-restricted-properties */
/* eslint-disable prefer-template */
/* eslint-disable one-var */
/* eslint-disable no-underscore-dangle */

'use strict';

const {join} = require('path');
const chalk = require('chalk');
const formatDistance = require('date-fns/formatDistance');
const File = require('./file');

class Version {
    constructor({
        version = '',
        integrity = '',
        author = {},
        created = null,
        type = '',
        name = '',
        org = '',
        files = [],
        meta = [],
    } = {}) {
        this.version = version;
        this.integrity = integrity;
        this.author = author;
        this.created = created;
        this.type = type;
        this.name = name;
        this.org = org;
        this.files = files;
        this.meta = meta;
    }

    format(baseURL = '') {
        const write = process.stdout.write.bind(process.stdout);
        const url = new URL(baseURL);
        const bURL = new URL(join(url.pathname, this.version), url.origin);
        
        write(`   - ${chalk.green(this.version)}\n`);
        write(`     ${chalk.bold('url:')} ${chalk.cyan(bURL.href)}\n`);
        write(`     ${chalk.bold('integrity:')} ${this.integrity}\n`);

        if (this.files && this.files.length) {
            write(`\n     ${chalk.bold('files:')}\n`);
            for (const file of this.files) {
                new File(file).format(bURL.href);
                write(`\n`);
            }
        }

        if (this.created) {
            const d = formatDistance(
                new Date(this.created * 1000),
                new Date(),
                { addSuffix: true }
            );
            write(`     ${chalk.bold('published')} ${chalk.yellow(d)}`);
        }

        if (this.author && this.author.name) {
            write(` ${chalk.bold('by')} ${chalk.yellow(this.author.name)}`);
        }
    }
}

module.exports = Version;