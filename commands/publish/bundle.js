'use strict';

const fetch = require('node-fetch');
const tempDir = require('temp-dir');
const ora = require('ora');
const mkdir = require('make-dir');
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const rollupReplace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const { terser } = require('rollup-plugin-terser');
const esmImportToUrl = require('rollup-plugin-esm-import-to-url');
const { join } = require('path');
const { readAssetsJson, sendCommand } = require('../../utils');
const { schemas } = require('@asset-pipe/common');
const tar = require('tar');
const babel = require('rollup-plugin-babel');
const copy = require('copy');

async function publishBundle(args) {
    console.log('');
    console.log('✨', 'Asset Pipe Publish Global Dependency', '✨');
    console.log('');

    const { dryRun = false } = args;
    let path = '';
    let assetsJson = {};
    let server = '';
    let organisation = '';
    let name = '';
    let version = '';
    let inputs = {};
    let importMap = {};
    let file = `index.js`;
    let zipFile = '';

    // load assets.json
    const loadAssetsFileSpinner = ora('Loading assets.json').start();
    try {
        assetsJson = readAssetsJson();
        ({ server, organisation, name, version, inputs } = assetsJson);
    } catch (err) {
        loadAssetsFileSpinner.fail(
            'Unable to load assets.json. Run "asset-pipe init" to generate'
        );

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    loadAssetsFileSpinner.succeed();

    // validate
    const inputValidationSpinner = ora('Validating input').start();

    const result = schemas.assets(assetsJson);

    if (result.error) {
        inputValidationSpinner.fail(`Invalid 'assets.json' file`);

        console.log('==========');

        for (const { message } of result.error) {
            console.error(message);
        }
        console.log('==========');

        process.exit();
    }

    inputValidationSpinner.succeed();

    // create temp directory
    const tempDirSpinner = ora('Creating temp directory').start();
    try {
        path = join(tempDir, `publish-${name}-${version}`);
        mkdir.sync(path);
    } catch (err) {
        tempDirSpinner.fail('Unable to create temp dir');

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    tempDirSpinner.succeed();

    // load import map file
    const loadImportMapSpinner = ora(
        'Loading import map file from server'
    ).start();
    try {
        const result = await fetch(`${server}/import-map/${organisation}/js`);
        importMap = await result.json();
    } catch (err) {
        loadImportMapSpinner.fail('Unable to load import map file from server');

        console.log('==========');
        console.error(err);
        console.log('==========');

        // process.exit();
    }
    loadImportMapSpinner.succeed();

    // create main bundle
    const assetsJsonCopySpinner = ora('Copying assets.json').start();
    try {
        const src = join(process.cwd(), 'assets.json');
        const dest = path;
        await new Promise((resolve, reject) => {
            copy(src, dest, err => {
                if (err) return reject(err);
                resolve();
            });
        });
    } catch (err) {
        assetsJsonCopySpinner.fail('Unable to copy assets.json file');

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    assetsJsonCopySpinner.succeed();

    // create main bundle
    const bundleSpinner = ora('Creating bundle file').start();
    try {
        const options = {
            onwarn: (warning, warn) => {
                // Supress logging
            },
            plugins: [
                esmImportToUrl(importMap),
                resolve(),
                commonjs({
                    // include: /node_modules/,
                }),
                // fetch and read import-map file from server
                rollupReplace({
                    'process.env.NODE_ENV': JSON.stringify('production'),
                }),
                terser(),
            ],
            input: join(process.cwd(), inputs.js),
        };

        const bundled = await rollup.rollup(options);
        await bundled.write({
            format: 'esm',
            file: join(path, 'main', file),
            sourcemap: true,
        });
    } catch (err) {
        bundleSpinner.fail('Unable to create bundle file');

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    bundleSpinner.succeed();

    // create ie11 fallback bundle
    const ie11FallbackBundle = ora('Creating fallback bundle file').start();
    try {
        const options = {
            onwarn: (warning, warn) => {
                // Supress logging
            },
            plugins: [
                resolve(),
                commonjs({
                    // include: /node_modules/,
                }),
                babel({
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
                                    ie: '11',
                                },
                            },
                        ],
                    ],
                    babelrc: false,
                }),
                rollupReplace({
                    'process.env.NODE_ENV': JSON.stringify('production'),
                }),
                terser(),
            ],
            input: join(process.cwd(), inputs.js),
        };
        const bundled = await rollup.rollup(options);
        await bundled.write({
            format: 'iife',
            file: join(path, 'ie11', file),
            sourcemap: true,
        });

        console.log();
        console.log('the path is:', path);
    } catch (err) {
        ie11FallbackBundle.fail('Unable to create bundle file');

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    ie11FallbackBundle.succeed();

    // create zip archive
    const zipSpinner = ora('Creating zip file').start();
    try {
        zipFile = join(path, `archive.tgz`);
        // zip up files
        // main js file
        // main css file
        // ie11 js file
        // assets.json file

        console.log(path, zipFile);

        await tar.c(
            {
                gzip: true,
                file: zipFile,
                cwd: path,
            },
            [
                `main/${file}`,
                `main/${file}.map`,
                `ie11/${file}`,
                `ie11/${file}.map`,
                `assets.json`,
            ]
        );
    } catch (err) {
        zipSpinner.fail('Unable to create zip file');

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    zipSpinner.succeed();

    if (dryRun) {
        console.log('Dry run');
        console.log('archive.tgz', zipFile);
        console.log('index.js', file);
        console.log('index.js.map', `${file}.map`);
        process.exit();
    }

    // upload files
    const uploadSpinner = ora('Uploading bundle file to server').start();
    try {
        await sendCommand({
            method: 'POST',
            host: server,
            pathname: `/${organisation}/js/${name}/${version}`,
            // data: JSON.stringify({}),
            file,
        });
    } catch (err) {
        uploadSpinner.fail('Unable to upload bundle file');

        console.log('==========');
        console.error(err);
        console.log('==========');

        process.exit();
    }
    uploadSpinner.succeed();

    console.log('');
    console.log('✨✨');
    console.log('');
}

module.exports = publishBundle;
