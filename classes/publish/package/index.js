'use strict';

const abslog = require('abslog');
const { join, isAbsolute } = require('path');
const { EikConfig } = require('@eik/common');
const { typeSlug } = require('../../../utils');
const ValidateInput = require('./tasks/validate-input');
const CreateTempDirectory = require('./tasks/create-temp-directory');
const CreateZipFile = require('./tasks/create-zip-file');
const CheckBundleSizes = require('./tasks/check-bundle-sizes');
const DryRun = require('./tasks/dry-run');
const CheckIfAlreadyPublished = require('./tasks/check-if-already-published');
const UploadFiles = require('./tasks/upload-files');
const SaveMetafile = require('./tasks/save-metafile');
const Cleanup = require('./tasks/cleanup');

module.exports = class Publish {
    constructor({
        logger,
        cwd = process.cwd(),
        token,
        dryRun = false,
        server,
        type = 'package',
        name,
        version = '1.0.0',
        map = [],
        out = './.eik',
        files = {},
    } = {}) {
        const config = new EikConfig(
            {
                server,
                type,
                name,
                version,
                'import-map': map,
                out,
                files,
            },
            [[server, token]],
            cwd,
        );
        config.validate();

        this.log = abslog(logger);
        this.cwd = cwd;
        this.dryRun = dryRun;
        this.config = config;
        this.path = isAbsolute(config.out) ? config.out : join(cwd, config.out);

        this.validateInput = new ValidateInput({
            logger: this.log,
            path: this.path,
            config,
        });
        this.createTempDirectory = new CreateTempDirectory({
            path: this.path,
            logger: this.log,
            config,
        });
        this.createZipFile = new CreateZipFile({
            logger: this.log,
            path: this.path,
            config,
        });
        this.checkBundleSizes = new CheckBundleSizes({
            cwd,
            logger: this.log,
            config,
        });
        this.runDryRun = new DryRun({ path: this.path, config });
        this.checkIfAlreadyPublished = new CheckIfAlreadyPublished({
            logger: this.log,
            path: this.path,
            config,
        });
        this.uploadFiles = new UploadFiles({ logger: this.log, config });
        this.saveMetafile = new SaveMetafile({ logger: this.log, cwd, config });
        this.cleanup = new Cleanup({
            logger: this.log,
            path: this.path,
            config,
        });
    }

    async run() {
        this.log.debug(`Running package command against server`);
        this.log.debug(`  ==> package name: ${this.config.name}`);
        this.log.debug(`  ==> package version: ${this.config.version}`);
        this.log.debug(`  ==> server: ${this.config.server}`);
        this.log.debug(`  ==> type: ${this.config.type}`);

        await this.validateInput.process();
        await this.createTempDirectory.process();
        const zipFile = await this.createZipFile.process();
        await this.checkBundleSizes.process();

        if (this.dryRun) {
            const files = await this.runDryRun.process(zipFile);
            return {
                type: typeSlug(this.config.type),
                server: this.config.server,
                name: this.config.name,
                level: this.level,
                dryRun: this.dryRun,
                integrity: '',
                created: null,
                author: {},
                org: '',
                version: this.config.version,
                response: {},
                files,
            };
        }

        let integrity;
        try {
            integrity = await this.checkIfAlreadyPublished.process();
        } catch (err) {
            // exit early if already published
            this.log.debug(`Determined that files have already been published. Additional information: ${err.message}`);
            return null;
        }

        const response = await this.uploadFiles.process(zipFile);
        await this.saveMetafile.process(response);
        await this.cleanup.process();

        return {
            type: typeSlug(this.config.type),
            server: this.config.server,
            name: this.config.name,
            level: this.level,
            dryRun: this.dryRun,
            created: null,
            author: {},
            org: '',
            version: this.config.version,
            integrity,
            ...response,
        };
    }
};
