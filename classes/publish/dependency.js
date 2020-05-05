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
const { sendCommand } = require('../../utils');

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
        this.path = join(tempDir, `publish-${name}-${version}-${Date.now()}`);
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
            assert(this.token && typeof this.token === 'string', 'Parameter "token" is not valid');
        } catch (err) {
            this.log.error('Parameter "token" is not valid');
            return false;
        }

        try {
            validators.name(this.name);
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
                    dependencies: {},
                }),
            );
        } catch (err) {
            this.log.error('Unable to create package json in temp directory');
            this.log.warn(err.message);

            this.log.debug('Cleaning up');
            if (existsSync(this.path)) {
                rimraf.sync(this.path);
            }

            return false;
        }

        this.log.debug('Loading import map file from server');
        try {
            const maps = this.map.map(m =>
                fetch(m).then(r => {
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
            const dependencies = results.map(r => r.imports);
            this.importMap = {
                imports: Object.assign({}, ...dependencies),
            };
        } catch (err) {
            this.log.warn(
                `Unable to load import map file from server: ${err.message}`,
            );
        }

        this.log.debug('Running npm install in temp directory');
        try {
            let cmd = `npm install ${this.name}`;
            if (this.version) cmd += `@${this.version}`;
            execSync(`${cmd} --loglevel=silent -E`, { cwd: this.path });

            const pkgjson = JSON.parse(readFileSync(join(this.path, 'package.json')));
            this.version = pkgjson.dependencies[this.name];
        } catch (err) {
            this.log.error(
                'Unable to complete npm install operation, is the supplied module version correct?',
            );
            this.log.warn(err.message);

            this.log.debug('Cleaning up');
            if (existsSync(this.path)) {
                rimraf.sync(this.path);
            }

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
            }).packageJson;
        } catch (err) {
            this.log.error('Unable to load package meta information');
            this.log.warn(err.message);

            this.log.debug('Cleaning up');
            if (existsSync(this.path)) {
                rimraf.sync(this.path);
            }

            return false;
        }

        this.log.debug('Creating bundle in temp directory');
        try {
            const options = {
                onwarn: () => {},
                plugins: [
                    json(),
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

            this.log.debug('Cleaning up');
            if (existsSync(this.path)) {
                rimraf.sync(this.path);
            }

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

            this.log.debug('Cleaning up');
            if (existsSync(this.path)) {
                rimraf.sync(this.path);
            }

            return false;
        }

        if (this.dryRun) {
            this.log.debug('Dry run files ready for upload to server');
            this.log.debug(`  ==> ${this.zipFile}`);
            this.log.debug(`  ==> ${this.file}`);
            this.log.debug(`  ==> ${this.file}.map`);
            this.log.info(
                `Published dependency package "${this.name}" at version "${this.version}" (dry run)`,
            );
            return true;
        }

        this.log.debug('Uploading zip file to server');

        try {
            const { message } = await sendCommand({
                method: 'PUT',
                host: this.server,
                pathname: join(
                    'npm',
                    this.name,
                    this.version,
                ),
                file: this.zipFile,
                token: this.token,
            });

            this.log.debug(`:: npm ${message.name} v${message.version}`);
            this.log.debug(`   scope:     ${message.org}`);
            this.log.debug(`   integrity: ${message.integrity}`);
            this.log.debug(`   files:`);

            if (message.files) {
                for (const file of message.files) {
                    this.log.debug(`   ==> pathname:  ${file.pathname}`);
                    this.log.debug(`       mimeType:  ${file.mimeType}`);
                    this.log.debug(`       type:      ${file.type}`);
                    this.log.debug(`       size:      ${file.size}`);
                    this.log.debug(`       integrity: ${file.integrity}`);
                }
            }
        } catch (err) {
            this.log.error('Unable to upload zip file to server');
            switch (err.statusCode) {
                case 400:
                    this.log.warn(
                        'Client attempted to send an invalid URL parameter',
                    );
                    break;
                case 401:
                    this.log.warn('Client unauthorized with server');
                    break;
                case 409:
                    this.log.warn(
                        `Package with name "${this.name}" and version "${this.version}" already exists on server`,
                    );
                    break;
                case 415:
                    this.log.warn(
                        'Client attempted to send an unsupported file format to server',
                    );
                    break;
                case 502:
                    this.log.warn('Server was unable to write file to storage');
                    break;
                default:
                    this.log.warn('Server failed');
            }

            this.log.debug('Cleaning up');
            if (existsSync(this.path)) {
                rimraf.sync(this.path);
            }

            return false;
        }

        this.log.debug('Cleaning up');
        if (existsSync(this.path)) {
            rimraf.sync(this.path);
        }

        this.log.info(
            `Published dependency package "${this.name}" at version "${this.version}"`,
        );
        return true;
    }
};
