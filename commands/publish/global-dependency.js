'use strict';

const abslog = require('abslog');
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
const { join, dirname } = require('path');
const { sendCommand } = require('../../utils');
const v = require('../../validators');

module.exports = class Publish {
    constructor({
        logger,
        cwd = process.cwd(),
        server,
        org,
        name,
        version,
        dryRun = false
    } = {}) {
        this.log = abslog(logger);
        this.cwd = cwd;
        this.server = server;
        this.org = org;
        this.name = name;
        this.version = version;
        this.dryRun = dryRun;
        // this.replace = [];
        this.path = join(tempDir, `publish-${name}-${version}`);
    }

    async run() {
        // this.replace = !Array.isArray(this.replace)
        //     ? this.replace
        //     : [this.replace];

        if (v.version.validate(this.version).error) {
            this.log.error(
                `Invalid 'semver' range given to 'version' argument`
            );
            return;
        }

        if (v.name.validate(this.name).error) {
            this.log.error(`Invalid 'pattern' given to 'name' argument`);
            return;
        }

        this.log.debug('Creating temporary directory');
        try {
            mkdir.sync(this.path);
        } catch (err) {
            this.log.error('Unable to create temp dir');
            this.log.warn(err.message);
            return;
        }

        // create package.json in temp dir
        this.log.debug('Creating package json file in temp directory');
        try {
            writeFileSync(
                join(this.path, 'package.json'),
                JSON.stringify({
                    name: '',
                    dependencies: {
                        [this.name]: this.version
                    }
                })
            );
        } catch (err) {
            this.log.error('Unable to create package json in temp directory');
            this.log.warn(err.message);
            return;
        }

        // // run npm install in temp dir
        this.log.debug('Running npm install in temp directory');
        try {
            execSync('npm i --loglevel=silent', { cwd: this.path });
        } catch (err) {
            this.log.error(
                'Unable to complete npm install operation, is the supplied module version correct?'
            );
            this.log.warn(err.message);
            return;
        }
        // load meta info for package
        this.log.debug(`Loading meta information for ${this.name} package`);
        try {
            const resolvedPath = require.resolve(this.name, {
                paths: [this.path]
            });
            this.installedDepBasePath = pkgDir.sync(dirname(resolvedPath));
            this.installedDepPkgJson = readPkgUp.sync({
                cwd: this.installedDepBasePath
            }).package;
        } catch (err) {
            this.log.error('Unable to load package meta information');
            this.log.warn(err.message);
            return;
        }
        /*

        // package analysis
        const checkPeerDependenciesSpinner = ora(
            `Checking for peer dependencies`
        ).start();
        try {
            // console.log(installedDepPkgJson);
            // console.log(installedDepPkgJson.peerDependencies);

            if (installedDepPkgJson.peerDependencies) {
                // check that a global flag has been supplied for each
                for (const dep of Object.keys(
                    installedDepPkgJson.peerDependencies
                )) {
                    const globalPkgNames = replace.map(global => {
                        const [moduleName] = global.split('@');
                        return moduleName;
                    });
                    if (!globalPkgNames.includes(dep)) {
                        checkPeerDependenciesSpinner.fail(
                            `Package ${name} contains peer dependencies that must be referenced`
                        );

                        console.log('==========');
                        console.error(
                            `You can fix this error by performing the following 2 steps:
1. Globally publish an appropriate version of "${dep}"
2. Republish "${name}" using the --replace flag to replace "${dep}" imports with the version of "${dep}" published in 1..
   Eg. --replace ${dep}@1.0.0`
                        );
                        console.log('==========');

                        process.exit();
                    }
                }
            }
        } catch (err) {
            checkPeerDependenciesSpinner.fail(
                'Unable to complete check for peer dependencies'
            );

            console.log('==========');
            console.error(err.message);
            console.log('==========');

            process.exit();
        }
        checkPeerDependenciesSpinner.succeed();
*/
        // bundle
        //      handle peer deps flag
        this.log.debug('Creating bundle in temp directory');
        try {
            /*
            const imports = {};
            if (replace.length) {
                replace.forEach(global => {
                    const [moduleName, moduleVersion] = global.split('@');
                    // TODO: handle aliases and absolute URLs as well as specific versions
                    imports[
                        moduleName
                    ] = `${server}/${organisation}/pkg/${moduleName}/${moduleVersion}/index.js`;
                });
            }
*/
            const options = {
                onwarn: (warning, warn) => {
                    // Supress logging
                },
                plugins: [
                    // esmImportToUrl({ imports }),
                    resolve(),
                    commonjs({ include: /node_modules/ }),
                    rollupReplace({
                        'process.env.NODE_ENV': JSON.stringify('production')
                    }),
                    terser()
                ]
            };

            if (this.installedDepPkgJson.module) {
                // use installedDepPkgJson.module
                this.log.debug('Dependency format: esm modules detected');
                options.input = join(
                    this.installedDepBasePath,
                    this.installedDepPkgJson.module
                );
            } else if (this.installedDepPkgJson.main) {
                // use installedDepPkgJson.main
                this.log.debug(
                    'Dependency format: common js modules detected, conversion to esm will occur'
                );
                options.input = join(
                    this.installedDepBasePath,
                    this.installedDepPkgJson.main
                );
            } else {
                // use installedDepPkgJson.main
                this.log.debug(
                    'Dependency format: common js modules assumed, conversion to esm will occur'
                );
                options.input = join(this.installedDepBasePath, 'index.js');
            }

            this.file = join(this.path, `index.js`);

            const bundled = await rollup.rollup(options);
            await bundled.write({
                format: 'esm',
                file: this.file,
                sourcemap: true
            });
        } catch (err) {
            this.log.error('Unable to complete bundle operation');
            this.log.warn(err.message);
            return;
        }

        this.log.debug('Creating zip file');
        try {
            this.zipFile = join(this.path, `archive.tgz`);

            await tar.c(
                {
                    gzip: true,
                    file: this.zipFile,
                    cwd: this.path
                },
                [`index.js`, `index.js.map`]
            );
        } catch (err) {
            this.log.error('Unable to create zip file');
            this.log.warn(err.message);
            return;
        }

        // upload
        //      handle dry run
        //      handle force flag

        if (this.dryRun) {
            this.log.debug('Zipped Archive For Uploading:');
            this.log.debug(`  ==> ${this.zipFile}`);
            this.log.debug('Main JavaScript Bundle File:');
            this.log.debug(`  ==> ${this.file}`);
            this.log.debug('Main JavaScript Bundle Source Map File:');
            this.log.debug(`  ==> ${this.file}.map`);
            this.log.info('✨ Done ✨');
            return;
        }

        this.log.debug('Uploading bundle to asset server');
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
            this.log.error('Unable to complete upload to asset server');
            this.log.warn(err.message);
            return;
        }

        this.log.info('✨ Done ✨');
    }
};
