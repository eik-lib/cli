'use strict';

const assert = require('assert');
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
// eslint-disable-next-line import/no-unresolved
const json = require('@rollup/plugin-json');
const { execSync } = require('child_process');
const { writeFileSync, existsSync, readFileSync } = require('fs');
const { join, dirname, parse } = require('path');
const { validators } = require('@eik/common');
const rimraf = require('rimraf');
const { request } = require('../../utils/fetch');

module.exports = class PublishDependency {
    constructor({
        logger,
        cwd = process.cwd(),
        server,
        name,
        version,
        map = [],
        dryRun = false,
        token,
    } = {}) {
        this.log = abslog(logger);
        this.cwd = cwd;
        this.server = server;
        this.token = token;
        this.name = name;
        this.version = version;
        this.map = map;
        this.dryRun = dryRun;
        this.path = join(tempDir, `publish-${name}-${version || 'latest'}-${Date.now()}`);
    }

    async run() {
        const data = {
            type: 'npm',
            dryRun: this.dryRun,
            name: this.name,
            server: this.server,
            version: this.version,
        };

        this.log.debug('Running publish command');

        this.log.debug('Validating input');
        parse(this.cwd);
        validators.origin(this.server);
        assert(
            this.token && typeof this.token === 'string',
            'Parameter "token" is not valid',
        );
        validators.name(this.name);
        assert(Array.isArray(this.map), 'Parameter "map" is not valid');
        assert(
            !this.dryRun || this.dryRun === true || this.dryRun === false,
            'Parameter "dryRun" is not valid',
        );

        this.log.debug('Creating temporary directory');
        try {
            mkdir.sync(this.path);
        } catch (err) {
            throw new Error('Unable to create temp dir');
        }

        this.log.debug('Creating package json file in temp directory');
        try {
            writeFileSync(
                join(this.path, 'package.json'),
                JSON.stringify({
                    name: '',
                    dependencies: {},
                }),
            );
        } catch (err) {
            this.log.debug('Cleaning up');
            if (existsSync(this.path)) {
                rimraf.sync(this.path);
            }
            throw new Error('Unable to create package json in temp directory');
        }

        this.log.debug('Loading import map file from server');
        try {
            const maps = this.map.map((m) =>
                fetch(m).then((r) => {
                    switch (true) {
                        case r.status === 404:
                            throw new Error(
                                'Import map could not be found on server',
                            );
                        case r.status >= 400 && r.status < 500:
                            throw new Error('Server rejected client request');
                        case r.status >= 500:
                            throw new Error('Server error');
                        default:
                            return r.json();
                    }
                }),
            );
            const results = await Promise.all(maps);
            const dependencies = results.map((r) => r.imports);
            this.importMap = {
                imports: Object.assign({}, ...dependencies),
            };
        } catch (err) {
            throw new Error(
                `Unable to load import map file from server: ${err.message}`,
            );
        }

        this.log.debug('Running npm install in temp directory');
        try {
            let cmd = `npm install ${this.name}`;
            if (this.version) cmd += `@${this.version}`;
            execSync(`${cmd} --loglevel=silent -E`, { cwd: this.path });

            const pkgjson = JSON.parse(
                readFileSync(join(this.path, 'package.json')),
            );
            this.version = pkgjson.dependencies[this.name];
        } catch (err) {
            this.log.debug('Cleaning up');
            if (existsSync(this.path)) {
                rimraf.sync(this.path);
            }
            throw new Error(
                'Unable to complete npm install operation, is the supplied module version correct?',
            );
        }

        this.log.debug(`Loading meta information for ${this.name} package`);
        try {
            const resolvedPath = require.resolve(this.name, {
                paths: [this.path],
            });
            this.installedDepBasePath = pkgDir.sync(dirname(resolvedPath));
            this.installedDepPkgJson = readPkgUp.sync({
                cwd: this.installedDepBasePath,
            }).packageJson;
        } catch (err) {
            this.log.debug('Cleaning up');
            if (existsSync(this.path)) {
                rimraf.sync(this.path);
            }
            throw new Error('Unable to load package meta information');
        }

        this.log.debug('Creating bundle in temp directory');
        try {
            const options = {
                onwarn: () => {},
                plugins: [
                    json(),
                    esmImportToUrl(this.importMap),
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
            this.log.debug('Cleaning up');
            if (existsSync(this.path)) {
                rimraf.sync(this.path);
            }
            throw new Error('Unable to complete bundle operation');
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
            this.log.debug('Cleaning up');
            if (existsSync(this.path)) {
                rimraf.sync(this.path);
            }
            throw new Error('Unable to create zip file');
        }

        if (this.dryRun) {
            return {
                ...data,
                version: this.version,
                files: [
                    { pathname: this.path, type: 'temporary directory' },
                    { pathname: this.zipFile, type: 'package archive' },
                    { pathname: this.file, type: 'package file' },
                    { pathname: `${this.file}.map`, type: 'package file' },
                ],
            };
        }

        this.log.debug('Uploading zip file to server');
        try {
            const { message } = await request({
                method: 'PUT',
                host: this.server,
                pathname: join('npm', this.name, this.version),
                file: this.zipFile,
                token: this.token,
            });

            return {
                ...data,
                ...message,
            };
        } catch (err) {
            this.log.debug('Cleaning up');
            if (existsSync(this.path)) {
                rimraf.sync(this.path);
            }
            switch (err.statusCode) {
                case 400:
                    throw new Error(
                        'Client attempted to send an invalid URL parameter',
                    );
                case 401:
                    throw new Error('Client unauthorized with server');
                case 409:
                    throw new Error(
                        `NPM package with name "${this.name}" and version "${this.version}" already exists on server`,
                    );
                case 415:
                    throw new Error(
                        'Client attempted to send an unsupported file format to server',
                    );
                case 502:
                    throw new Error(
                        'Server was unable to write file to storage',
                    );
                default:
                    throw new Error('Server failed');
            }
        }
    }
};
