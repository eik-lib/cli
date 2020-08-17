/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */

'use strict';

const fs = require('fs');
const { join, resolve, basename, dirname } = require('path');
const tar = require('tar');
const Task = require('./task');
const { entrypoints: mapEntrypoints } = require('../../../../utils');

const { copyFileSync, writeFileSync } = fs;

module.exports = class CreateZipFile extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { entrypoints, path, name, map, server, out, cwd } = incoming;

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
                        entrypoints,
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

        if (entrypoints) {
            try {
                const mappings = await mapEntrypoints(entrypoints, path, {
                    cwd,
                });

                for (const [src, dest] of mappings) {
                    await fs.promises.mkdir(dirname(dest), {
                        recursive: true,
                    });
                    copyFileSync(src, dest);
                    filesToZip.push(dest.replace(path, '.'));
                }
            } catch (err) {
                throw new Error(
                    `Failed to copy files for zipping: ${err.message}`,
                );
            }
        }

        try {
            // eslint-disable-next-line no-param-reassign
            incoming.zipFile = resolve(`${path}/eik.tgz`);

            await tar.c(
                {
                    gzip: true,
                    file: incoming.zipFile,
                    cwd: path,
                },
                filesToZip,
            );
        } catch (err) {
            throw new Error(`Unable to create zip file: ${err.message}`);
        }

        return outgoing;
    }
};
