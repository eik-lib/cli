import abslog from 'abslog';
import { join, isAbsolute } from 'path';
import { EikConfig } from '@eik/common';
import { typeSlug } from '../../../utils/index.js';
import ValidateInput from './tasks/validate-input.js';
import CreateTempDirectory from './tasks/create-temp-directory.js';
import CreateZipFile from './tasks/create-zip-file.js';
import CheckBundleSizes from './tasks/check-bundle-sizes.js';
import DryRun from './tasks/dry-run.js';
import CheckIfAlreadyPublished from './tasks/check-if-already-published.js';
import UploadFiles from './tasks/upload-files.js';
import SaveMetafile from './tasks/save-metafile.js';
import Cleanup from './tasks/cleanup.js';

export default class Publish {
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
            ...response,
        };
    }
};
