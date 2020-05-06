'use strict';

const { join } = require('path');
const fetch = require('node-fetch');
const homedir = require('os').homedir();
const ora = require('ora');
const { readFileSync } = require('fs');
const av = require('yargs-parser')(process.argv.slice(2));
const PublishPackage = require('../classes/publish/package/index');
const { resolvePath, logger, readMetaFile, Artifact } = require('../utils');

exports.command = 'package';

exports.aliases = ['publish', 'pkg', 'pub'];

exports.describe = `Publish an apps dependencies based on local assets.json file.`;

exports.builder = (yargs) => {
    const cwd = av.cwd || av.c || process.cwd();

    let assets = {};
    try {
        const assetsPath = resolvePath('./assets.json', cwd).pathname;
        assets = JSON.parse(readFileSync(assetsPath));
    } catch (err) {
        // noop
    }

    yargs.options({
        server: {
            alias: 's',
            describe: 'Specify location of asset server.',
            default: assets.server || '',
        },
        cwd: {
            alias: 'c',
            describe: 'Alter current working directory.',
            default: process.cwd(),
        },
        map: {
            alias: 'm',
            describe:
                'Provide an array of URLs to import maps that should be used when making bundles',
            default: assets['import-map'] || [],
        },
        dryRun: {
            alias: 'd',
            describe:
                'Terminates the publish early (before upload) and provides information about created bundles for inspection.',
            default: false,
            type: 'boolean',
        },
        debug: {
            describe: 'Logs additional messages',
            default: false,
            type: 'boolean',
        },
        js: {
            describe:
                'Specify the path on local disk to JavaScript client side assets relative to the current working directory.',
            default: assets.js && assets.js.input,
        },
        css: {
            describe:
                'Specify the path on local disk to CSS client side assets relative to the current working directory.',
            default: assets.css && assets.css.input,
        },
        name: {
            describe: 'Specify the app name.',
            default: assets.name,
        },
        major: {
            describe: 'Major semver version to lock updates to.',
            default: assets.major,
        },
        level: {
            alias: 'l',
            describe:
                'Specify the app semver level to use when updating the package.',
            default: 'patch',
        },
        token: {
            describe:
                'Provide a jwt token to be used to authenticate with the Eik server.',
            default: '',
            alias: 't',
        },
    });
};

exports.handler = async (argv) => {
    const spinner = ora({ stream: process.stdout }).start('working...');
    let success = false;
    let artifact;
    const { debug, token, server, map, name, dryRun } = argv;

    try {
        const meta = await readMetaFile({ cwd: homedir });
        const tokens = new Map(meta.tokens);
        const t = token || tokens.get(server) || '';

        let m = map;
        if (m && !Array.isArray(m)) {
            m = [m];
        }
        
        const options = { 
            logger: logger(spinner, debug), 
            ...argv, 
            token: t,
            map: m,
        };
        const version = await new PublishPackage(options).run();

        if (!dryRun) {
            let url = new URL(join('pkg', name), server);
            let res = await fetch(url);
            const pkgMeta = await res.json();

            url = new URL(join('pkg', name, version), server);
            res = await fetch(url);
            const pkgVersionMeta = await res.json();

            artifact = new Artifact(pkgMeta);
            artifact.versions = [ pkgVersionMeta ];
        } 
        
        if (version || dryRun) {
            success = true;
        } else {
            success = false;
        }

    } catch (err) {
        spinner.warn(err.message);
    }

    if (success) {
        spinner.text = '';
        spinner.stopAndPersist();
        if (!dryRun) { 
            artifact.format(server);
            process.stdout.write('\n');
        }
    } else {
        spinner.text = '';
        spinner.stopAndPersist();
        process.exit(1);
    }
};
