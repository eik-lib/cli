import { join } from 'path';
import { integrity, versions } from '../../../../utils/http/index.js';
import hash from '../../../../utils/hash/index.js';
import { typeSlug } from '../../../../utils/index.js';
import Task from './task.js';

export default class CheckIfAlreadyPublished extends Task {
    async process() {
        const { log, path } = this;
        const { server, name, version, files, type } = this.config;

        log.debug(
            `Checking for existence of package ${name} version ${version}`,
        );
        log.debug('  ==> Fetching package metadata from server');

        try {
            if (await integrity(server, typeSlug(type), name, version)) {
                throw new Error(
                    `${name} version ${version} already exists on the Eik server. Publishing is not necessary.`,
                );
            }
            log.debug(`  ==> Package version ${version} does not yet exist`);
        } catch (err) {
            throw new Error(
                `Unable to fetch package metadata from server: ${err.message}`,
            );
        }

        let pkgVersions;
        try {
            pkgVersions = await versions(server, typeSlug(type), name);
        } catch (err) {
            throw new Error(
                `Unable to fetch package metadata from server: ${err.message}`,
            );
        }

        if (!pkgVersions) {
            log.debug('  ==> Package has never been published');
            return null;
        }

        log.debug(`  ==> However, previous versions of package do exist`);
        log.debug('  ==> Checking if local files have changed');

        let localHash;
        try {
            const localFiles = [join(path, './eik.json')];
            if (files) {
                const mappings = await this.config.mappings();

                for (const mapping of mappings) {
                    const destination = join(
                        path,
                        mapping.destination.filePathname,
                    );
                    localFiles.push(destination);
                }
            }
            localHash = await hash.files(localFiles);
        } catch (err) {
            throw new Error(
                `Unable to hash local files for comparison: ${err.message}`,
            );
        }

        const versionMap = new Map(pkgVersions);
        for (const v of versionMap.values()) {
            const same = hash.compare(v.integrity, localHash);
            if (same) {
                throw new Error(
                    `Version ${v.version} of this package already contains these files, publishing is not necessary.`,
                );
            }
            log.debug(
                '  ==> New files do not match existing files, continue with publishing',
            );
        }

        return localHash;
    }
}
