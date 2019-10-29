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
const { join, parse } = require('path');
const { validators } = require('@asset-pipe/common');
const { sendCommand } = require('../../utils');
const tar = require('tar');
const babel = require('rollup-plugin-babel');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const fs = require('fs');
const cssnano = require('cssnano');
const compressedSize = require('../../utils/compressed-size');

module.exports = class Publish {
    constructor({
        logger,
        cwd = process.cwd(),
        server,
        org,
        name,
        version,
        map,
        js,
        css,
        dryRun = false
    } = {}) {
        this.log = abslog(logger);
        this.cwd = cwd;
        this.server = server;
        this.org = org;
        this.name = name;
        this.version = version;
        this.map = map;
        this.js = js;
        this.css = css;
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

        if (!this.js || typeof this.js !== 'string') {
            this.log.error('Parameter "js" is not valid');
            return false;
        }

        if (!this.css || typeof this.css !== 'string') {
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
        } catch (err) {
            this.log.error('Unable to create temp dir');
            this.log.warn(err.message);
            return false;
        }

        this.log.debug('Loading import map file from server');
        try {
            const maps = this.map.map(m => fetch(m).then(r => r.json()));
            const results = await Promise.all(maps);
            const dependencies = results.map(r => r.imports);
            this.importMap = {
                imports: Object.assign({}, ...dependencies)
            };
        } catch (err) {
            this.log.warn('Unable to load import map file from server');
            this.log.warn(err.message);
        }

        // create main js bundle
        this.log.debug('Creating main bundle file');
        try {
            const options = {
                onwarn: (warning, warn) => {
                    // Supress logging
                },
                plugins: [
                    esmImportToUrl(this.importMap),
                    resolve(),
                    commonjs(),
                    rollupReplace({
                        'process.env.NODE_ENV': JSON.stringify('production')
                    }),
                    terser()
                ],
                input: join(this.cwd, this.js)
            };

            const bundled = await rollup.rollup(options);
            await bundled.write({
                format: 'esm',
                file: join(this.path, 'main/index.js'),
                sourcemap: true
            });
        } catch (err) {
            this.log.error('Unable to create bundle file');
            this.log.warn(err.message);
            return false;
        }

        this.log.debug('Creating js fallback bundle file');
        try {
            const options = {
                onwarn: (warning, warn) => {
                    // Supress logging
                },
                plugins: [
                    resolve(),
                    commonjs(),
                    babel({
                        compact: true,
                        presets: [
                            [
                                join(
                                    __dirname,
                                    `../../node_modules/@babel/preset-env`
                                ),
                                {
                                    useBuiltIns: 'usage',
                                    corejs: 3,
                                    // browsers: 'ie11',
                                    targets: {
                                        ie: '11'
                                    }
                                }
                            ]
                        ],
                        babelrc: false
                    }),
                    rollupReplace({
                        'process.env.NODE_ENV': JSON.stringify('production')
                    }),
                    terser()
                ],
                input: join(this.cwd, this.js)
            };
            const bundled = await rollup.rollup(options);
            await bundled.write({
                format: 'iife',
                file: join(this.path, 'ie11/index.js'),
                sourcemap: true
            });
        } catch (err) {
            this.log.error('Unable to create bundle file');
            this.log.warn(err.message);
            return false;
        }

        // create main css bundle
        this.log.debug('Creating css bundle file');
        try {
            if (this.css) {
                const input = join(this.cwd, this.css);
                const precss = fs.readFileSync(input, 'utf8');
                const processor = postcss(autoprefixer());

                processor.use(cssnano());

                const result = await processor.process(precss, {
                    from: this.css.replace(/(.*\/)*/, ''),
                    to: 'index.css',
                    map: { inline: false }
                });
                fs.writeFileSync(join(this.path, 'main/index.css'), result.css);
                fs.writeFileSync(
                    join(this.path, 'main/index.css.map'),
                    result.map
                );
            } else {
                this.log.debug('CSS assets not specified');
            }
        } catch (err) {
            this.log.error('Unable to create css bundle file');
            this.log.warn(err.message);
            return false;
        }

        // create zip archive
        this.log.debug('Creating zip file');
        try {
            this.zipFile = join(this.path, `archive.tgz`);

            await tar.c(
                {
                    gzip: true,
                    file: this.zipFile,
                    cwd: this.path
                },
                [
                    `main/index.js`,
                    `main/index.js.map`,
                    `ie11/index.js`,
                    `ie11/index.js.map`,
                    `main/index.css`,
                    `main/index.css.map`,
                    `assets.json`
                ]
            );
        } catch (err) {
            this.log.error('Unable to create zip file');
            this.log.warn(err.message);
            return false;
        }

        this.log.debug('Checking bundle file sizes');
        try {
            const mainIndexJSSize = compressedSize(
                fs.readFileSync(`${this.path}/main/index.js`, 'utf8')
            );
            const ie11IndexJSSize = compressedSize(
                fs.readFileSync(`${this.path}/ie11/index.js`, 'utf8')
            );
            const mainIndexCSSSize = compressedSize(
                fs.readFileSync(`${this.path}/main/index.css`, 'utf8')
            );
            this.log.debug(
                `  ==> Main index.js size: ${bytes(mainIndexJSSize)}`
            );
            this.log.debug(
                `  ==> ie11 index.js size: ${bytes(ie11IndexJSSize)}`
            );
            this.log.debug(
                `  ==> Main index.css size: ${bytes(mainIndexCSSSize)}`
            );
        } catch (err) {
            this.log.debug('Failed to check bundle sizes');
            this.log.warn(err.message);
        }

        if (this.dryRun) {
            this.log.debug('Dry run files ready for upload to server:');
            this.log.debug(`  ==> ${this.zipFile}`);
            this.log.debug(`  ==> ${this.path}/main/index.js`);
            this.log.debug(`  ==> ${this.path}/main/index.js.map`);
            this.log.debug(`  ==> ${this.path}/ie11/index.js`);
            this.log.debug(`  ==> ${this.path}/ie11/index.js.map`);
            this.log.debug(`  ==> ${this.path}/main/index.css`);
            this.log.debug(`  ==> ${this.path}/main/index.css.map`);
            this.log.debug('Publish command complete (dry run)');
            return true;
        }

        // upload files
        this.log.debug('Uploading zip file to server');
        try {
            const messages = await sendCommand({
                method: 'PUT',
                host: this.server,
                pathname: `/${this.org}/pkg/${this.name}/${this.version}`,
                file: this.zipFile
            });

            messages.forEach(msg => {
                this.log.debug(`  ==> ${JSON.stringify(msg)}`);
            });
        } catch (err) {
            this.log.error('Unable to upload zip file to server');
            this.log.warn(err.message);
            return false;
        }

        this.log.debug('Publish command complete');
        return true;
    }
};
