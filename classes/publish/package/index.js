'use strict';

const abslog = require('abslog');
const { join, isAbsolute } = require('path');
const ValidateInput = require('./tasks/validate-input');
const CreateTempDirectory = require('./tasks/create-temp-directory');
const CreateZipFile = require('./tasks/create-zip-file');
const CheckBundleSizes = require('./tasks/check-bundle-sizes');
const DryRun = require('./tasks/dry-run');
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
        version = '1.0.0',
        map = [],
        config,
        dryRun = false,
        out = './.eik',
        npm = false,
    } = {}) {
        this.log = abslog(logger);
        this.cwd = cwd;
        this.server = server;
        this.token = token;
        this.name = name;
        this.version = version;
        this.map = map;
        this.dryRun = dryRun;
        this.out = out;
        this.config = config;
        this.npm = npm;
        this.path = isAbsolute(out) ? out : join(cwd, out);
        this.validateInput = new ValidateInput(this.log);
        this.createTempDirectory = new CreateTempDirectory(this.log);
        this.createZipFile = new CreateZipFile(this.log, config);
        this.checkBundleSizes = new CheckBundleSizes(this.log);
        this.runDryRun = new DryRun(this.log, config);
        this.checkIfAlreadyPublished = new CheckIfAlreadyPublished(this.log, config);
        this.uploadFiles = new UploadFiles(this.log);
        this.saveMetafile = new SaveMetafile(this.log);
        this.cleanup = new Cleanup(this.log);
    }

    async run() {
        this.log.debug(`Running package command against server`);
        this.log.debug(`  ==> package name: ${this.name}`);
        this.log.debug(`  ==> package version: ${this.version}`);
        this.log.debug(`  ==> server: ${this.server}`);

        const incoming = {
            path: this.path,
            files: this.config.files,
            server: this.server,
            name: this.name,
            version: this.version,
            importMap: {},
            zipFile: '',
            level: this.level,
            map: this.map,
            cwd: this.cwd,
            token: this.token,
            dryRun: this.dryRun,
            out: this.out,
            type: this.npm ? 'npm' : 'pkg',
        };

        const outgoing = {
            type: this.npm ? 'npm' : 'pkg',
            server: this.server,
            name: this.name,
            level: this.level,
            dryRun: this.dryRun,
            integrity: '',
            files: [],
            created: null,
            author: {},
            org: '',
            version: this.version,
            response: {},
        };

        await this.validateInput.process(incoming, outgoing);
        await this.createTempDirectory.process(incoming, outgoing);
        await this.createZipFile.process(incoming, outgoing);
        await this.checkBundleSizes.process(incoming, outgoing);

        if (this.dryRun) {
            await this.runDryRun.process(incoming, outgoing);
            return outgoing;
        }

        try {
            await this.checkIfAlreadyPublished.process(incoming, outgoing);
        } catch (err) {
            // exit early if already published
            return null;
        }

        await this.uploadFiles.process(incoming, outgoing);
        await this.saveMetafile.process(incoming, outgoing);
        await this.cleanup.process(incoming, outgoing);

        return outgoing;
    }
};
