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
        token,
        name,
        major = 1,
        level = 'patch',
        map = [],
        js,
        css,
        dryRun = false,
    } = {}) {
        this.log = abslog(logger);
        this.cwd = cwd;
        this.server = server;
        this.token = token;
        this.name = name;
        this.major = major;
        this.level = level;
        this.map = map;
        this.js = js;
        this.css = css;
        this.dryRun = dryRun;
        this.path = join(tempDir, `publish-${name}-${major}-${Date.now()}`);
        this.validateInput = new ValidateInput(this.log);
        this.createTempDirectory = new CreateTempDirectory(this.log);
        this.fetchImportMaps = new FetchImportMaps(this.log);
        this.createBundles = new CreateBundles(this.log);
        this.createZipFile = new CreateZipFile(this.log);
        this.checkBundleSizes = new CheckBundleSizes(this.log);
        this.runDryRun = new DryRun(this.log);
        this.fetchVersion = new FetchVersion(this.log);
        this.checkIfAlreadyPublished = new CheckIfAlreadyPublished(this.log);
        this.uploadFiles = new UploadFiles(this.log);
        this.saveMetafile = new SaveMetafile(this.log);
        this.cleanup = new Cleanup(this.log);
    }

    async run() {
        this.log.debug('Running publish command');

        const incoming = {
            path: this.path,
            js: this.js,
            css: this.css,
            server: this.server,
            name: this.name,
            version: null,
            importMap: {},
            zipFile: '',
            major: this.major,
            level: this.level,
            map: this.map,
            cwd: this.cwd,
            token: this.token,
            dryRun: this.dryRun,
        };

        const outgoing = {
            type: 'pkg',
            server: this.server,
            name: this.name,
            major: this.major,
            level: this.level,
            dryRun: this.dryRun,
            integrity: '',
            files: [],
            created: null,
            author: {},
            org: '',
            version: '',
        };

        await this.validateInput.process(incoming, outgoing);
        await this.createTempDirectory.process(incoming, outgoing);
        await this.fetchImportMaps.process(incoming, outgoing);
        await this.createBundles.process(incoming, outgoing);
        await this.createZipFile.process(incoming, outgoing);
        await this.checkBundleSizes.process(incoming, outgoing);
        await this.fetchVersion.process(incoming, outgoing);
        await this.checkIfAlreadyPublished.process(incoming, outgoing);

        if (this.dryRun) {
            await this.runDryRun.process(incoming, outgoing);
            return outgoing;
        }
            
        await this.uploadFiles.process(incoming, outgoing);
        await this.saveMetafile.process(incoming, outgoing);
        await this.cleanup.process(incoming, outgoing);

        return outgoing;
    }
};
