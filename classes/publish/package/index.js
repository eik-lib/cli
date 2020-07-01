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
        js,
        css,
        dryRun = false,
        out = './.eik',
    } = {}) {
        this.log = abslog(logger);
        this.cwd = cwd;
        this.server = server;
        this.token = token;
        this.name = name;
        this.version = version;
        this.map = map;

        this.js = js;
        if (typeof js === 'string') {
            this.js = {
                './index.js': js,
            };
        }
        this.css = css;
        if (typeof css === 'string') {
            this.css = {
                './index.css': css,
            };
        }
        this.dryRun = dryRun;
        this.out = out;
        this.path = isAbsolute(out) ? out : join(cwd, out);
        this.validateInput = new ValidateInput(this.log);
        this.createTempDirectory = new CreateTempDirectory(this.log);
        this.createZipFile = new CreateZipFile(this.log);
        this.checkBundleSizes = new CheckBundleSizes(this.log);
        this.runDryRun = new DryRun(this.log);
        this.checkIfAlreadyPublished = new CheckIfAlreadyPublished(this.log);
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
            js: this.js,
            css: this.css,
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
        };

        const outgoing = {
            type: 'pkg',
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
        };

        await this.validateInput.process(incoming, outgoing);
        await this.createTempDirectory.process(incoming, outgoing);
        await this.createZipFile.process(incoming, outgoing);
        await this.checkBundleSizes.process(incoming, outgoing);

        if (this.dryRun) {
            await this.runDryRun.process(incoming, outgoing);
            return outgoing;
        }

        await this.checkIfAlreadyPublished.process(incoming, outgoing);
            
        await this.uploadFiles.process(incoming, outgoing);
        await this.saveMetafile.process(incoming, outgoing);
        await this.cleanup.process(incoming, outgoing);

        return outgoing;
    }
};
