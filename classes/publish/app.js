'use strict';

const abslog = require('abslog');
const bytes = require('bytes');
const fetch = require('node-fetch');
const tempDir = require('temp-dir');
const mkdir = require('make-dir');
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const rollupReplace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const { terser } = require('rollup-plugin-terser');
const esmImportToUrl = require('rollup-plugin-esm-import-to-url');
const atImport = require('postcss-import');
const { join, parse } = require('path');
const { validators } = require('@eik/common');
const tar = require('tar');
const babel = require('rollup-plugin-babel');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const fs = require('fs');
const cssnano = require('cssnano');
const rimraf = require('rimraf');
const {
    compressedSize,
    sendCommand,
    compareHashes,
    fetchLatestVersion,
    fetchPackageMeta,
    calculateLocalHash,
    incrementSemverVersion,
    writeMetaFile,
} = require('../../utils');

module.exports = class PublishApp {
    constructor({
        logger,
        cwd = process.cwd(),
        server,
        org,
        name,
        major,
        level = 'patch',
        map = [],
        js,
        css,
        dryRun = false,
    } = {}) {
        this.log = abslog(logger);
        this.cwd = cwd;
        this.server = server;
        this.org = org;
        this.name = name;
        this.major = major;
        this.level = level;
        this.map = map;
        this.js = js;
        this.css = css;
        this.dryRun = dryRun;
        this.path = join(tempDir, `publish-${name}-${major}-${Date.now()}`);
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
            // validators.version(this.version);
        } catch (err) {
            this.log.error(err.message);
            return false;
        }

        if (!this.js && !this.css) {
            this.log.error('At least one of "js" or "css" must be provided');
            return false;
        }

        if (this.js && typeof this.js !== 'string') {
            this.log.error('Parameter "js" is not valid');
            return false;
        }

        if (this.css && typeof this.css !== 'string') {
            this.log.error('Parameter "css" is not valid');
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
            mkdir.sync(join(this.path, 'main'));
            mkdir.sync(join(this.path, 'ie11'));
        } catch (err) {
            this.log.error('Unable to create temp dir');
            this.log.warn(err.message);
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
            this.log.warn('Unable to load import map file from server');
            this.log.warn(err.message);
        }

        // create main js bundle
        if (this.js) {
            this.log.debug('Creating main bundle file');
            try {
                const options = {
                    onwarn: () => {},
                    plugins: [
                        esmImportToUrl(this.importMap),
                        resolve(),
                        commonjs(),
                        rollupReplace({
                            'process.env.NODE_ENV': JSON.stringify(
                                'production',
                            ),
                        }),
                        terser(),
                    ],
                    input: join(this.cwd, this.js),
                };

                const bundled = await rollup.rollup(options);
                await bundled.write({
                    format: 'esm',
                    file: join(this.path, 'main/index.js'),
                    sourcemap: true,
                });
            } catch (err) {
                this.log.error('Unable to create bundle file');
                this.log.warn(err.message);

                this.log.debug('Cleaning up');
                if (fs.existsSync(this.path)) {
                    rimraf.sync(this.path);
                }

                return false;
            }

            this.log.debug('Creating js fallback bundle file');
            try {
                const options = {
                    onwarn: () => {},
                    plugins: [
                        resolve(),
                        commonjs(),
                        babel({
                            compact: true,
                            presets: [
                                [
                                    join(
                                        __dirname,
                                        `../../node_modules/@babel/preset-env`,
                                    ),
                                    {
                                        useBuiltIns: 'usage',
                                        corejs: 3,
                                        // browsers: 'ie11',
                                        targets: {
                                            ie: '11',
                                        },
                                    },
                                ],
                            ],
                            babelrc: false,
                        }),
                        rollupReplace({
                            'process.env.NODE_ENV': JSON.stringify(
                                'production',
                            ),
                        }),
                        terser(),
                    ],
                    input: join(this.cwd, this.js),
                };
                const bundled = await rollup.rollup(options);
                await bundled.write({
                    format: 'iife',
                    file: join(this.path, 'ie11/index.js'),
                    sourcemap: true,
                });
            } catch (err) {
                this.log.error('Unable to create bundle file');
                this.log.warn(err.message);

                this.log.debug('Cleaning up');
                if (fs.existsSync(this.path)) {
                    rimraf.sync(this.path);
                }

                return false;
            }
        } else {
            this.log.debug(
                'JavaScript entrypoint not defined, skipping JS bundling',
            );
        }

        if (this.css) {
            // create main css bundle
            this.log.debug('Creating css bundle file');
            try {
                if (this.css) {
                    const input = join(this.cwd, this.css);
                    const precss = fs.readFileSync(input, 'utf8');
                    const processor = postcss(autoprefixer());

                    processor.use(atImport());
                    processor.use(cssnano());

                    const result = await processor.process(precss, {
                        from: this.css.replace(/(.*\/)*/, ''),
                        to: 'index.css',
                        map: { inline: false },
                    });
                    fs.writeFileSync(
                        join(this.path, 'main/index.css'),
                        result.css,
                    );
                    fs.writeFileSync(
                        join(this.path, 'main/index.css.map'),
                        result.map,
                    );
                } else {
                    this.log.debug('CSS assets not specified');
                }
            } catch (err) {
                this.log.error('Unable to create css bundle file');
                this.log.warn(err.message);

                this.log.debug('Cleaning up');
                if (fs.existsSync(this.path)) {
                    rimraf.sync(this.path);
                }

                return false;
            }
        } else {
            this.log.debug('CSS entrypoint not defined, skipping CSS bundling');
        }

        // create zip archive
        this.log.debug('Creating zip file');

        const filesToZip = [];
        if (this.js) {
            filesToZip.push(
                `main/index.js`,
                `main/index.js.map`,
                `ie11/index.js`,
                `ie11/index.js.map`,
            );
        }
        if (this.css) {
            filesToZip.push(`main/index.css`, `main/index.css.map`);
        }

        try {
            this.zipFile = join(this.path, `archive.tgz`);

            await tar.c(
                {
                    gzip: true,
                    file: this.zipFile,
                    cwd: this.path,
                },
                filesToZip,
            );
        } catch (err) {
            this.log.error('Unable to create zip file');
            this.log.warn(err.message);

            this.log.debug('Cleaning up');
            if (fs.existsSync(this.path)) {
                rimraf.sync(this.path);
            }

            return false;
        }

        this.log.debug('Checking bundle file sizes');
        try {
            if (this.js) {
                const mainIndexJSSize = compressedSize(
                    fs.readFileSync(`${this.path}/main/index.js`, 'utf8'),
                );
                this.log.debug(
                    `  ==> Main index.js size: ${bytes(mainIndexJSSize)}`,
                );
                const ie11IndexJSSize = compressedSize(
                    fs.readFileSync(`${this.path}/ie11/index.js`, 'utf8'),
                );
                this.log.debug(
                    `  ==> ie11 index.js size: ${bytes(ie11IndexJSSize)}`,
                );
            }
            if (this.css) {
                const mainIndexCSSSize = compressedSize(
                    fs.readFileSync(`${this.path}/main/index.css`, 'utf8'),
                );
                this.log.debug(
                    `  ==> Main index.css size: ${bytes(mainIndexCSSSize)}`,
                );
            }
        } catch (err) {
            this.log.debug('Failed to check bundle sizes');
            this.log.warn(err.message);
        }

        if (this.dryRun) {
            this.log.debug('Dry run files ready for upload to server:');
            this.log.debug(`  ==> ${this.zipFile}`);
            if (this.js) {
                this.log.debug(`  ==> ${this.path}/main/index.js`);
                this.log.debug(`  ==> ${this.path}/main/index.js.map`);
                this.log.debug(`  ==> ${this.path}/ie11/index.js`);
                this.log.debug(`  ==> ${this.path}/ie11/index.js.map`);
            }
            if (this.css) {
                this.log.debug(`  ==> ${this.path}/main/index.css`);
                this.log.debug(`  ==> ${this.path}/main/index.css.map`);
            }
            this.log.info(`Published app package "${this.name}" (dry run)`);
            return true;
        }

        this.log.debug(
            'Calculating latest version for package. Fetching previous version information from server.',
        );
        let version;
        try {
            version = await fetchLatestVersion(
                this.server,
                this.org,
                this.name,
                this.major,
            );

            if (!version) {
                version = [`${this.major || '1'}`, '0', '0'].join('.');
            } else {
                version = incrementSemverVersion(version, this.level);
            }
        } catch (err) {
            this.log.error('Unable to calculate latest version for package');
            this.log.warn(err.message);
        }

        this.log.debug('Fetching package metadata from server.');
        let meta;
        try {
            meta = await fetchPackageMeta(
                this.server,
                this.org,
                this.name,
                version,
            );
        } catch (err) {
            this.log.error('Unable to fetch package metadata from server');
            this.log.warn(err.message);
        }

        this.log.debug('Hashing local files for comparison with server');

        let localHash;
        try {
            const localFiles = [];
            if (this.js) {
                localFiles.push(
                    join(this.path, 'main', 'index.js'),
                    join(this.path, 'main', 'index.js.map'),
                    join(this.path, 'ie11', 'index.js'),
                    join(this.path, 'ie11', 'index.js.map'),
                );
            }
            if (this.css) {
                localFiles.push(
                    join(this.path, 'main', 'index.css'),
                    join(this.path, 'main', 'index.css.map'),
                );
            }
            localHash = await calculateLocalHash(localFiles);
        } catch (err) {
            this.log.error('Unable to hash local files for comparison');
            this.log.warn(err.message);
        }

        const same = compareHashes(meta.integrity, localHash);

        if (same) {
            this.log.warn(
                `The current version of this package already contains these files, publishing is not necessary.`,
            );

            this.log.debug('Cleaning up');

            if (fs.existsSync(this.path)) {
                rimraf.sync(this.path);
            }

            return true;
        }

        // upload files
        this.log.debug('Uploading zip file to server');
        try {
            const { message } = await sendCommand({
                method: 'PUT',
                host: this.server,
                pathname: join(this.org, 'pkg', this.name, version),
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
                        `Package with name "${this.name}" and version "${version}" already exists on server`,
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
            if (fs.existsSync(this.path)) {
                rimraf.sync(this.path);
            }

            return false;
        }

        this.log.debug('Saving .eikrc metafile.');
        try {
            await writeMetaFile({ version, integrity: [] });
        } catch (err) {
            this.log.error('Unable to save .eikrc metafile.');
            this.log.warn(err.message);
        }

        this.log.debug('Cleaning up');
        if (fs.existsSync(this.path)) {
            rimraf.sync(this.path);
        }

        this.log.info(
            `Published app package "${this.name}" at version "${version}"`,
        );
        return true;
    }
};
