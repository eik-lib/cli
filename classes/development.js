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
        try {
            if (this.js) {
                this.log.debug('Creating js bundle file');
                try {
                    const options = {
                        onwarn: () => {},
                        plugins: [resolve(), commonjs()],
                        input: join(this.cwd, this.js),
                    };

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
                    development.js = join(this.path, 'main/index.js');
                } catch (err) {
                    throw new Error(
                        `Unable to create js bundle file: ${err.message}`,
                    );
                }
            }

            if (this.css) {
                try {
                    this.log.debug('Creating css bundle file');

                    const input = join(this.cwd, this.css);
                    const precss = fs.readFileSync(input, 'utf8');
                    const processor = postcss(autoprefixer());

                    processor.use(atImport());
                    processor.use(cssnano());

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
                    development.css = join(this.path, 'main/index.css');
                } catch (err) {
                    throw new Error(
                        `Unable to create css bundle file: ${err.message}`,
                    );
                }
            } else {
                this.log.debug('CSS assets not specified');
            }

            if (development.js || development.css) {
                const meta = await readMetaFile();
                meta.development = development;
                await writeMetaFile(meta);
                this.log.debug('.eikrc metafile saved to disk');
            }
        } catch (err) {
            this.log.error('Unable to bundle assets for development');
            this.log.warn(err.message);
            return false;
        }
    }
};
