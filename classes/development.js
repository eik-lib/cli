/* eslint-disable consistent-return */

'use strict';

const abslog = require('abslog');
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const atImport = require('postcss-import');
const { join } = require('path');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const fs = require('fs');
const cssnano = require('cssnano');
const tempDir = require('temp-dir');
const chokidar = require('chokidar');
const { readMetaFile, writeMetaFile } = require('../utils');

module.exports = class Meta {
    constructor({ logger, name, watch, cwd, debug, js, css } = {}) {
        this.log = abslog(logger);
        this.watch = watch;
        this.cwd = cwd;
        this.debug = debug;
        this.js = js;
        this.css = css;
        this.path = join(tempDir, `publish-${name}`, 'development');
    }

    async run() {
        this.log.debug('Creating development asset bundles');

        const development = {};
        if (this.js) {
            this.log.debug('Creating js bundle file');
            try {
                const options = {
                    onwarn: () => {},
                    plugins: [resolve(), commonjs()],
                    input: join(this.cwd, this.js),
                };

                if (this.watch) {
                    const bundled = await rollup.watch({
                        ...options,
                        output: {
                            format: 'esm',
                            file: join(this.path, 'main/index.js'),
                            sourcemap: 'inline',
                        },
                    });
                    bundled.on('event', event => {
                        switch (event.code) {
                            case 'START':
                                this.log.debug(
                                    'js file watcher is (re)starting',
                                );
                                break;
                            case 'END':
                                this.log.debug(
                                    'js file watcher has finished building bundle',
                                );
                                break;
                            case 'ERROR':
                                this.log.debug(
                                    'js file watcher encountered an error while bundling',
                                );
                                break;
                            default:
                                break;
                        }
                    });
                    this.log.debug(
                        `Development js bundle file generated and saved to ${join(
                            this.path,
                            'main/index.js',
                        )}`,
                    );
                } else {
                    const bundled = await rollup.rollup(options);
                    await bundled.write({
                        format: 'esm',
                        file: join(this.path, 'main/index.js'),
                        sourcemap: 'inline',
                    });
                    this.log.debug(
                        `Development js bundle file generated and saved to ${join(
                            this.path,
                            'main/index.js',
                        )}`,
                    );
                }
                development.js = join(this.path, 'main/index.js');
            } catch (err) {
                this.log.error(
                    `Unable to create js bundle file: ${err.message}`,
                );
                this.log.warn(err.message);
                return false;
            }
        } else {
            this.log.debug('JS assets not specified');
        }

        if (this.css) {
            try {
                this.log.debug('Creating css bundle file');

                const input = join(this.cwd, this.css);
                const processor = postcss(autoprefixer());

                processor.use(atImport());
                processor.use(cssnano());

                if (this.watch) {
                    chokidar
                        .watch('**/*.css', {
                            ignored: /node_modules/,
                            cwd: this.cwd,
                            followSymlinks: false,
                            persistent: true,
                        })
                        .on('all', async () => {
                            this.log.debug('css file watcher is (re)starting');
                            const precss = fs.readFileSync(input, 'utf8');
                            const result = await processor.process(precss, {
                                from: this.css.replace(/(.*\/)*/, ''),
                                to: 'index.css',
                                map: { inline: true },
                            });
                            fs.writeFileSync(
                                join(this.path, 'main/index.css'),
                                result.css,
                            );
                            this.log.debug(
                                'file watcher has finished building css bundle',
                            );
                        });
                    this.log.debug(
                        `Development css bundle file generated and saved to ${join(
                            this.path,
                            'main/index.css',
                        )}`,
                    );
                } else {
                    const precss = fs.readFileSync(input, 'utf8');
                    const result = await processor.process(precss, {
                        from: this.css.replace(/(.*\/)*/, ''),
                        to: 'index.css',
                        map: { inline: true },
                    });
                    fs.writeFileSync(
                        join(this.path, 'main/index.css'),
                        result.css,
                    );
                    this.log.debug(
                        `Development css bundle file generated and saved to ${join(
                            this.path,
                            'main/index.css',
                        )}`,
                    );
                }
                development.css = join(this.path, 'main/index.css');
            } catch (err) {
                this.log.error(
                    `Unable to create css bundle file: ${err.message}`,
                );
                this.log.warn(err.message);
                return false;
            }
        } else {
            this.log.debug('CSS assets not specified');
        }

        if (development.js || development.css) {
            try {
                const meta = await readMetaFile();
                meta.development = development;
                await writeMetaFile(meta);
                this.log.debug('.eikrc metafile saved to disk');
                return true;
            } catch (err) {
                this.log.error('Unable to save .eikrc metafile to disk');
                this.log.warn(err.message);
                return false;
            }
        }
    }
};
