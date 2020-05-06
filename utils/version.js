/* eslint-disable no-restricted-properties */
/* eslint-disable prefer-template */
/* eslint-disable one-var */
/* eslint-disable no-underscore-dangle */

'use strict';

const {join} = require('path');
const chalk = require('chalk');
const formatDistance = require('date-fns/formatDistance');

const _integrity = Symbol('integrity');
const _version = Symbol('type');
const _author = Symbol('author');
const _created = Symbol('created');
const _type = Symbol('type');
const _name = Symbol('name');
const _org = Symbol('org');
const _files = Symbol('files');
const _meta = Symbol('meta');

function readableBytes(bytes) {
    const i = Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + sizes[i];
}

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

    get version() {
        return this[_version];
    }

    set version(version) {
        this[_version] = version;
    }

    get integrity() {
        return this[_integrity];
    }

    set integrity(integrity) {
        this[_integrity] = integrity;
    }

    get author() {
        return this[_author];
    }
    
    set author(author) {
        this[_author] = author;
    }

    get created() {
        return this[_created];
    }
    
    set created(created) {
        this[_created] = created;
    }
    
    get type() {
        return this[_type];
    }
    
    set type(type) {
        this[_type] = type;
    }

    get name() {
        return this[_name];
    }
    
    set name(name) {
        this[_name] = name;
    }

    get org() {
        return this[_org];
    }
    
    set org(org) {
        this[_org] = org;
    }

    get files() {
        return this[_files];
    }
    
    set files(files) {
        this[_files] = files;
    }

    get meta() {
        return this[_meta];
    }
    
    set meta(meta) {
        this[_meta] = meta;
    }

    format(baseURL = '') {
        const write = process.stdout.write.bind(process.stdout);
        const url = new URL(baseURL);
        const bURL = new URL(join(url.pathname, this.version), url.origin);
        
        write(`   - ${chalk.green(this.version)}\n`);
        write(`     ${chalk.bold('url:')} ${chalk.cyan(bURL.href)}\n`);
        write(`     ${chalk.bold('integrity:')} ${this.integrity}\n`);

        if (this.files) {
            write(`\n     ${chalk.bold('files:')}\n`);
            for (const file of this.files) {
                const fileUrl = new URL(join(bURL.pathname, file.pathname), url.origin);
                write(`     - ${chalk.cyan(fileUrl.href)} `);
                write(`${chalk.yellow(file.mimeType)} `);
                write(`${chalk.magenta(readableBytes(file.size))}\n`);
                write(`       ${chalk.bold('integrity:')} ${file.integrity}\n\n`);
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

        if (this.author) {
            write(` ${chalk.bold('by')} ${chalk.yellow(this.author.name)}`);
        }
    }
}

module.exports = Version;