'use strict';

const abslog = require('abslog');
const fetch = require('node-fetch');
const tempDir = require('temp-dir');
const tar = require('tar');
const mkdir = require('make-dir');
const readPkgUp = require('read-pkg-up');
const pkgDir = require('pkg-dir');
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const rollupReplace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const { terser } = require('rollup-plugin-terser');
const esmImportToUrl = require('rollup-plugin-esm-import-to-url');
const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const { join, dirname, parse } = require('path');
const { validators } = require('@asset-pipe/common');
const { sendCommand } = require('../../utils');

module.exports = class PublishDependency {
    constructor({
        logger,
        cwd = process.cwd(),
        server,
        org,
        name,
        version,
        map = [],
        dryRun = false,
    } = {}) {
        this.log = abslog(logger);
        this.cwd = cwd;
        this.server = server;
        this.org = org;
        this.name = name;
        this.version = version;
        this.map = map;
        this.dryRun = dryRun;
        this.path = join(tempDir, `publish-${name}-${version}`);
    }

    async run() {
        this.log.debug('Running publish command');

        this.log.debug('Validating input');
        try {
            parse(this.cwd);
        } catch (err) {
            this.log.error('Parameter "cwd" is not valid');
            return false;
        }

        try {
            validators.origin(this.server);
        } catch (err) {
            this.log.error(`Parameter "server" is not valid`);
            return false;
        }

        try {
            validators.org(this.org);
            validators.name(this.name);
            validators.version(this.version);
        } catch (err) {
            this.log.error(err.message);
            return false;
        }

        if (!Array.isArray(this.map)) {
            this.log.error('Parameter "map" is not valid');
            return false;
        }

        if (this.dryRun && this.dryRun !== true && this.dryRun !== false) {
            this.log.error('Parameter "dryRun" is not valid');
            return false;
        }

        this.log.debug('Creating temporary directory');
        try {
            mkdir.sync(this.path);
        } catch (err) {
            this.log.error('Unable to create temp dir');
            this.log.warn(err.message);
            return false;
        }

        this.log.debug('Creating package json file in temp directory');
        try {
            writeFileSync(
                join(this.path, 'package.json'),
                JSON.stringify({
                    name: '',
                    dependencies: {
                        [this.name]: this.version,
                    },
                }),
            );
        } catch (err) {
            this.log.error('Unable to create package json in temp directory');
            this.log.warn(err.message);
            return false;
        }

        this.log.debug('Loading import map file from server');
        try {
            const maps = this.map.map(m => fetch(m).then(r => r.json()));
            const results = await Promise.all(maps);
            const dependencies = results.map(r => r.imports);
            this.importMap = {
                imports: Object.assign({}, ...dependencies),
            };
        } catch (err) {
            this.log.warn('Unable to load import map file from server');
            this.log.warn(err.message);
        }

        this.log.debug('Running npm install in temp directory');
        try {
            execSync('npm i --loglevel=silent', { cwd: this.path });
        } catch (err) {
            this.log.error(
                'Unable to complete npm install operation, is the supplied module version correct?',
            );
            this.log.warn(err.message);
            return false;
        }

        this.log.debug(`Loading meta information for ${this.name} package`);
        try {
            const resolvedPath = require.resolve(this.name, {
                paths: [this.path],
            });
            this.installedDepBasePath = pkgDir.sync(dirname(resolvedPath));
            this.installedDepPkgJson = readPkgUp.sync({
                cwd: this.installedDepBasePath,
            }).package;
        } catch (err) {
            this.log.error('Unable to load package meta information');
            this.log.warn(err.message);
            return false;
        }

        this.log.debug('Creating bundle in temp directory');
        try {
            const options = {
                onwarn: () => {},
                plugins: [
                    esmImportToUrl({ imports: this.imports }),
                    resolve(),
                    commonjs({ include: /node_modules/ }),
                    rollupReplace({
                        'process.env.NODE_ENV': JSON.stringify('production'),
                    }),
                    terser(),
                ],
            };

            if (this.installedDepPkgJson.module) {
                this.log.debug('Dependency format: esm modules detected');
                options.input = join(
                    this.installedDepBasePath,
                    this.installedDepPkgJson.module,
                );
            } else if (this.installedDepPkgJson.main) {
                this.log.debug(
                    'Dependency format: common js modules detected, conversion to esm will occur',
                );
                options.input = join(
                    this.installedDepBasePath,
                    this.installedDepPkgJson.main,
                );
            } else {
                this.log.debug(
                    'Dependency format: common js modules assumed, conversion to esm will occur',
                );
                options.input = join(this.installedDepBasePath, 'index.js');
            }

            this.file = join(this.path, `index.js`);

            const bundled = await rollup.rollup(options);
            await bundled.write({
                format: 'esm',
                file: this.file,
                sourcemap: true,
            });
        } catch (err) {
            this.log.error('Unable to complete bundle operation');
            this.log.warn(err.message);
            return false;
        }

        this.log.debug('Creating zip file');
        try {
            this.zipFile = join(this.path, `archive.tgz`);

            await tar.c(
                {
                    gzip: true,
                    file: this.zipFile,
                    cwd: this.path,
                },
                [`index.js`, `index.js.map`],
            );
        } catch (err) {
            this.log.error('Unable to create zip file');
            this.log.warn(err.message);
            return false;
        }

        if (this.dryRun) {
            this.log.debug('Dry run files ready for upload to server');
            this.log.debug(`  ==> ${this.zipFile}`);
            this.log.debug(`  ==> ${this.file}`);
            this.log.debug(`  ==> ${this.file}.map`);
            this.log.debug('Publish command complete (dry run)');
            return true;
        }

        this.log.debug('Uploading zip file to server');
        try {
            const message = await sendCommand({
                method: 'PUT',
                host: this.server,
                pathname: join(this.org, 'pkg', this.name, this.version),
                file: this.zipFile,
            });

            this.log.debug(
                `  Org: ${message.org}, Name: ${message.name}, Version: ${message.version}`,
            );
            for (const file of message.files) {
                this.log.debug(`  ==> ${JSON.stringify(file)}`);
            }
        } catch (err) {
            this.log.error('Unable to upload zip file to server');
            this.log.warn(err.message);
            return false;
        }

        this.log.debug('Publish command complete');
        return true;
    }
};
