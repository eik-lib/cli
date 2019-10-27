'use strict';

const abslog = require('abslog');
const fetch = require('node-fetch');
const tempDir = require('temp-dir');
const mkdir = require('make-dir');
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const rollupReplace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const { terser } = require('rollup-plugin-terser');
const esmImportToUrl = require('rollup-plugin-esm-import-to-url');
const { join } = require('path');
const { sendCommand } = require('../../utils');
const tar = require('tar');
const babel = require('rollup-plugin-babel');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const fs = require('fs');
const cssnano = require('cssnano');

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
        this.log.debug('Creating temporary directory');
        try {
            mkdir.sync(this.path);
        } catch (err) {
            this.log.error('Unable to create temp dir');
            this.log.warn(err.message);
            return;
        }

        this.log.debug('Loading import map file from server');
        try {
            const result = await fetch(this.map);
            this.importMap = await result.json();
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
            return;
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
            return;
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
            return;
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
            return;
        }

        if (this.dryRun) {
            this.log.debug('Zipped Archive For Uploading:');
            this.log.debug(`  ==> ${this.zipFile}`);
            this.log.debug('Main JavaScript Bundle File:');
            this.log.debug(`  ==> ${this.path}/main/index.js`);
            this.log.debug('Main JavaScript Bundle Source Map File:');
            this.log.debug(`  ==> ${this.path}/main/index.js.map`);
            this.log.debug('ie11 Fallback JavaScript Bundle File:');
            this.log.debug(`  ==> ${this.path}/ie11/index.js`);
            this.log.debug('ie11 Fallback JavaScript Bundle Source Map File:');
            this.log.debug(`  ==> ${this.path}/ie11/index.js.map`);
            this.log.debug('Main CSS Bundle File:');
            this.log.debug(`  ==> ${this.path}/main/index.css`);
            this.log.debug('Main CSS Bundle Source Map File:');
            this.log.debug(`  ==> ${this.path}/main/index.css.map`);

            this.log.info('✨ Done (Dry Run) ✨');
            return;
        }

        // upload files
        this.log.debug('Uploading bundle file to server');
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
            this.log.error('Unable to upload bundle file');
            this.log.warn(err.message);
            return;
        }

        this.log.info('✨ Done ✨');
    }
};
