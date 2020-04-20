'use strict';

const ora = require('ora');
const { readFileSync } = require('fs');
const Meta = require('../classes/meta');
const { resolvePath, logger } = require('../utils');

exports.command = 'meta <name> <version>';

exports.aliases = ['show'];

exports.describe = `Retrieve meta information about a package`;

exports.builder = yargs => {
    const cwd = yargs.argv.cwd || yargs.argv.c || process.cwd();

    let assets = {};
    try {
        const assetsPath = resolvePath('./assets.json', cwd).pathname;
        assets = JSON.parse(readFileSync(assetsPath));
    } catch (err) {
        // noop
    }

    yargs
        .positional('name', {
            describe:
                'Name matching either package or import map name depending on type given',
            type: 'string',
        })
        .positional('version', {
            describe:
                'Version matching either package or import map version depending on type given',
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

exports.handler = async argv => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let meta = false;
    const { debug } = argv;
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
        
        process.stdout.write(`:: pkg ${meta.name} v${meta.version}\n`);
        process.stdout.write(`   scope:     ${meta.org}\n`);
        process.stdout.write(`   integrity: ${meta.integrity}\n`);
        process.stdout.write(`   files:\n`);

        if (meta.files) {
            for (const file of meta.files) {
                process.stdout.write(`   ==> pathname:  ${file.pathname}\n`);
                process.stdout.write(`       mimeType:  ${file.mimeType}\n`);
                process.stdout.write(`       type:      ${file.type}\n`);
                process.stdout.write(`       size:      ${file.size}\n`);
                process.stdout.write(`       integrity: ${file.integrity}\n`);
            }
        }

        spinner.text = '';
        spinner.stopAndPersist();
    } else {
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
