import { join } from 'path';
import chalk from 'chalk';
import File from './file.js';

function colorType(type) {
    if (type === 'npm') {
        return chalk.white.bgRed.bold(' NPM ');
    }

    if (type === 'pkg') {
        return chalk.white.bgYellow.bold(' PACKAGE ');
    }

    return chalk.white.bgBlue.bold(' IMPORT MAP ');
}

class Alias {
    constructor({
        type = '',
        name = '',
        alias = '',
        version = '',
        update = false,
        files = [],
        org = '',
        integrity = '',
    } = {}) {
        this.type = type;
        this.name = name;
        this.org = org;
        this.alias = alias;
        this.version = version;
        this.files = files;
        this.update = update;
        this.integrity = integrity;
    }

    format(baseURL = '') {
        const write = process.stdout.write.bind(process.stdout);
        const url = new URL(
            join(this.type, this.name, `v${this.alias}`),
            baseURL,
        );

        write(`:: `);

        write(`${colorType(this.type)} > ${chalk.green(this.name)} | `);
        write(`${chalk.bold('org:')} ${this.org} | `);
        write(`${chalk.bold('version:')} ${this.version} | `);
        write(`${chalk.bold('alias:')} v${this.alias} `);

        if (this.update) {
            write(`${chalk.bgMagenta.white(' UPDATED \n\n')}`);
        } else {
            write(`${chalk.bgGreen.white(' NEW ')}\n\n`);
        }

        if (url.href) {
            write(`   ${chalk.bold('url:      ')} ${chalk.cyan(url.href)}\n`);
        }

        if (this.integrity) {
            write(`   ${chalk.bold('integrity:')} ${this.integrity}\n`);
        }

        if (this.files.length) {
            write(`\n   ${chalk.bold('files:')}\n`);
        }

        for (const file of this.files) {
            new File(file).format(url.href);
            write(`\n`);
        }
        write(`\n`);
    }
}

export default Alias;
