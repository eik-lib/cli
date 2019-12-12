'use strict';

const abslog = require('abslog');
const tempDir = require('temp-dir');
const { join } = require('path');
const ValidateInput = require('./tasks/validate-input');
const CreateTempDirectory = require('./tasks/create-temp-directory');
const FetchImportMaps = require('./tasks/fetch-import-maps');
const CreateBundles = require('./tasks/create-bundles');
const CreateZipFile = require('./tasks/create-zip-file');
const CheckBundleSizes = require('./tasks/check-bundle-sizes');
const DryRun = require('./tasks/dry-run');
const FetchVersion = require('./tasks/fetch-version');
const CheckIfAlreadyPublished = require('./tasks/check-if-already-published');
const UploadFiles = require('./tasks/upload-files');
const SaveMetafile = require('./tasks/save-metafile');
const Cleanup = require('./tasks/cleanup');

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
        this.validateInput = new ValidateInput();
        this.createTempDirectory = new CreateTempDirectory();
        this.fetchImportMaps = new FetchImportMaps();
        this.createBundles = new CreateBundles();
        this.createZipFile = new CreateZipFile();
        this.checkBundleSizes = new CheckBundleSizes();
        this.runDryRun = new DryRun();
        this.fetchVersion = new FetchVersion();
        this.checkIfAlreadyPublished = new CheckIfAlreadyPublished();
        this.uploadFiles = new UploadFiles();
        this.saveMetafile = new SaveMetafile();
        this.cleanup = new Cleanup();
    }

    async run() {
        this.log.debug('Running publish command');

        try {
            await this.validateInput.process(this);
            await this.createTempDirectory.process(this);
            await this.fetchImportMaps.process(this);
            await this.createBundles.process(this);
            await this.createZipFile.process(this);
            await this.checkBundleSizes.process(this);
            await this.fetchVersion.process(this);
            await this.checkIfAlreadyPublished.process(this);
            if (this.dryRun) {
                await this.runDryRun.process(this);
            } else {
                await this.uploadFiles.process(this);
                await this.saveMetafile.process(this);
            }
        } catch (err) {
            this.log.error(err.message);
            return false;
        }

        this.cleanup.process(this);

        if (this.dryRun) {
            this.log.info(
                `Dry run for app package "${this.name}" at version "${this.nextVersion}" completed`,
            );
        } else {
            this.log.info(
                `Published app package "${this.name}" at version "${this.nextVersion}"`,
            );
        }

        return true;
    }
};
