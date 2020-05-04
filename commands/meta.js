/* eslint-disable prefer-template */
/* eslint-disable no-restricted-properties */
/* eslint-disable one-var */
'use strict';

const chalk = require('chalk');
const { readFileSync } = require('fs');
const { join } = require('path');
const ora = require('ora');
const formatDistance = require('date-fns/formatDistance');
const Meta = require('../classes/meta');
const { resolvePath, logger } = require('../utils');

exports.command = 'meta <name>';

exports.aliases = ['show'];

exports.describe = `Retrieve meta information by package, map or npm name`;

exports.builder = (yargs) => {
    const cwd = yargs.argv.cwd || yargs.argv.c || process.cwd();

    let assets = {};
    try {
        const assetsPath = resolvePath('./assets.json', cwd).pathname;
        assets = JSON.parse(readFileSync(assetsPath));
    } catch (err) {
        // noop
    }

    yargs.positional('name', {
        describe:
            'Name matching either package or import map name depending on type given',
        type: 'string',
    });

    yargs.options({
        server: {
            alias: 's',
            describe: 'Specify location of asset server.',
            default: assets.server || '',
        },
        debug: {
            describe: 'Logs additional messages',
            default: false,
            type: 'boolean',
        },
        cwd: {
            alias: 'c',
            describe: 'Alter current working directory.',
            default: process.cwd(),
        },
    });
};

function readableBytes(bytes) {
    const i = Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + sizes[i];
}

function colorType(type) {
    if (type === 'npm') {
        return chalk.white.bgRed.bold(' NPM ');
    }
    
    if (type === 'pkg') {
        return chalk.white.bgYellow.bold(' PACKAGE ');
    }

    return chalk.white.bgBlue.bold(' IMPORT MAP ')
}

function formatMeta({ name, type, versions, org } = {}, server) {
    const metaUrl = new URL(join(type, name), server);

    process.stdout.write(`:: ${colorType(type)} > ${chalk.green(name)} | `);
    process.stdout.write(`${chalk.bold('org:')} ${org} | `);
    process.stdout.write(`${chalk.bold('url:')} ${chalk.cyan(metaUrl.href)}\n`);

    if (versions.length) {
        process.stdout.write(`\n   ${chalk.bold('versions:')}\n`);
    }

    for (const { version, integrity, created, author, files } of versions) {
        const baseUrl = new URL(join(metaUrl.pathname, version), server);
        process.stdout.write(`   - ${chalk.green(version)}\n`);
        process.stdout.write(`     ${chalk.bold('url:')} ${chalk.cyan(baseUrl.href)}\n`);

        process.stdout.write(`     ${chalk.bold('integrity:')} ${integrity}\n`);

        if (files) {
            process.stdout.write(`\n     ${chalk.bold('files:')}\n`);
            for (const file of files) {
                const fileUrl = new URL(join(baseUrl.pathname, file.pathname), server);
                process.stdout.write(`     - ${chalk.cyan(fileUrl.href)} `);
                process.stdout.write(`${chalk.yellow(file.mimeType)} `);
                process.stdout.write(`${chalk.magenta(readableBytes(file.size))}\n`);
                process.stdout.write(`       ${chalk.bold('integrity:')} ${file.integrity}\n\n`);
            }
        }

        if (created) {
            const d = formatDistance(
                new Date(created * 1000),
                new Date(),
                { addSuffix: true }
            );
            process.stdout.write(`     ${chalk.bold('published')} ${chalk.yellow(d)}`);
        }

        if (author) {
            process.stdout.write(` ${chalk.bold('by')} ${chalk.yellow(author.name)}`);
        }

        process.stdout.write(`\n`);
        
    }
}

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let meta = false;
    const { debug, server } = argv;
    const l = logger(spinner, debug);

    try {
        meta = await new Meta({
            logger: l,
            ...argv,
        }).run();
    } catch (err) {
        l.warn(err.message);
    }

    if (meta) {
        spinner.text = '';
        spinner.stopAndPersist();
        
        for (const m of Object.values(meta)) {
            formatMeta(m, server);
            process.stdout.write(`\n`);
        }

        spinner.text = '';
        spinner.stopAndPersist();
    } else {
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
