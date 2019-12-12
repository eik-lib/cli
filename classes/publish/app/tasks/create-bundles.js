'use strict';

const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const rollupReplace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const { terser } = require('rollup-plugin-terser');
const esmImportToUrl = require('rollup-plugin-esm-import-to-url');
const atImport = require('postcss-import');
const { join } = require('path');
const babel = require('rollup-plugin-babel');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const fs = require('fs');
const cssnano = require('cssnano');

module.exports = class CreateBundles {
    async process(state = {}) {
        const { js, css, log, importMap, cwd, path } = state;
        if (js) {
            log.debug('Creating main bundle file');
            try {
                const options = {
                    onwarn: () => {},
                    plugins: [
                        esmImportToUrl(importMap),
                        resolve(),
                        commonjs(),
                        rollupReplace({
                            'process.env.NODE_ENV': JSON.stringify(
                                'production',
                            ),
                        }),
                        terser(),
                    ],
                    input: join(cwd, js),
                };

                const bundled = await rollup.rollup(options);
                await bundled.write({
                    format: 'esm',
                    file: join(path, 'main/index.js'),
                    sourcemap: true,
                });
            } catch (err) {
                throw new Error(
                    `Unable to create js bundle file: ${err.message}`,
                );
            }

            log.debug('Creating js fallback bundle file');
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
                                        `../../../../node_modules/@babel/preset-env`,
                                    ),
                                    {
                                        useBuiltIns: 'usage',
                                        corejs: 3,
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
                    input: join(cwd, js),
                };
                const bundled = await rollup.rollup(options);
                await bundled.write({
                    format: 'iife',
                    file: join(path, 'ie11/index.js'),
                    sourcemap: true,
                });
            } catch (err) {
                throw new Error(
                    `Unable to create js fallback bundle file: ${err.message}`,
                );
            }
        } else {
            log.debug(
                'JavaScript entrypoint not defined, skipping JS bundling',
            );
        }

        if (css) {
            log.debug('Creating css bundle file');
            try {
                if (css) {
                    const input = join(cwd, css);
                    const precss = fs.readFileSync(input, 'utf8');
                    const processor = postcss(autoprefixer());

                    processor.use(atImport());
                    processor.use(cssnano());

                    const result = await processor.process(precss, {
                        from: css.replace(/(.*\/)*/, ''),
                        to: 'index.css',
                        map: { inline: false },
                    });
                    fs.writeFileSync(join(path, 'main/index.css'), result.css);
                    fs.writeFileSync(
                        join(path, 'main/index.css.map'),
                        result.map,
                    );
                } else {
                    log.debug('CSS assets not specified');
                }
            } catch (err) {
                throw new Error(
                    `Unable to create css bundle file: ${err.message}`,
                );
            }
        } else {
            log.debug('CSS entrypoint not defined, skipping CSS bundling');
        }

        return state;
    }
};
