import fs from 'fs';
import { join, resolve, basename, dirname } from 'path';
import * as tar from 'tar';
import Task from './task.js';

const { copyFileSync, writeFileSync } = fs;

export default class CreateZipFile extends Task {
    async process() {
        const { log, path } = this;
        const { name, map, server, out, files } = this.config;

        log.debug(`Creating zip file`);
        log.debug(`  ==> ${join(path, `eik.tgz`)}`);

        const filesToZip = [];

        try {
            const eikPathDest = join(path, './eik.json');
            writeFileSync(
                eikPathDest,
                JSON.stringify(
                    {
                        name,
                        server,
                        files,
                        'import-map': map,
                        out,
                    },
                    null,
                    2,
                ),
            );
            filesToZip.push(basename(eikPathDest));
        } catch (err) {
            throw new Error(`Failed to zip eik.json file: ${err.message}`);
        }

        if (files) {
            try {
                const mappings = await this.config.mappings();

                for (const mapping of mappings) {
                    const destination = join(
                        path,
                        mapping.destination.filePathname,
                    );
                    await fs.promises.mkdir(dirname(destination), {
                        recursive: true,
                    });
                    copyFileSync(mapping.source.absolute, destination);
                    filesToZip.push(destination.replace(path, '.'));
                }
            } catch (err) {
                throw new Error(
                    `Failed to copy files for zipping: ${err.message}`,
                );
            }
        }

        try {
            const zipFile = resolve(`${path}/eik.tgz`);

            await tar.c(
                {
                    gzip: true,
                    file: zipFile,
                    cwd: path,
                },
                filesToZip,
            );

            return zipFile;
        } catch (err) {
            throw new Error(`Unable to create zip file: ${err.message}`);
        }
    }
}
