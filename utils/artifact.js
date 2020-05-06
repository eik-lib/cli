/* eslint-disable no-underscore-dangle */

'use strict';

const {join} = require('path');
const chalk = require('chalk');
const Version = require('./version');

const _name = Symbol('name');
const _type = Symbol('type');
const _org = Symbol('org');
const _versions = Symbol('versions');

function colorType(type) {
    if (type === 'npm') {
        return chalk.white.bgRed.bold(' NPM ');
    }
    
    if (type === 'pkg') {
        return chalk.white.bgYellow.bold(' PACKAGE ');
    }

    return chalk.white.bgBlue.bold(' IMPORT MAP ')
}

class Artifact {
    constructor({
        type = '',
        name = '',
        org = '',
        versions = [],
    } = {}) {
        this.type = type;
        this.name = name;
        this.org = org;
        this.versions = versions;
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
    
    get versions() {
        return this[_versions];
    }
    
    set versions(versions) {
        const v = [];
        for (const version of versions) {
            v.push(new Version(version, this.baseURL));
        }
        this[_versions] = v;
    }

    format (baseURL = '') {
        const write = process.stdout.write.bind(process.stdout);
        const url = new URL(join(this.type, this.name), baseURL);

        write(`:: ${colorType(this.type)} > ${chalk.green(this.name)} | `);
        write(`${chalk.bold('org:')} ${this.org} | `);
        write(`${chalk.bold('url:')} ${chalk.cyan(url.href)}\n`);

        if (this.versions.length) {
            write(`\n   ${chalk.bold('versions:')}\n`);
        }

        for (const version of this.versions) {
            version.format(url.href);
            write(`\n`);
        }
    }
}

module.exports = Artifact;