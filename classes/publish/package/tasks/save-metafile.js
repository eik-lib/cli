'use strict';

const { writeMetaFile, readMetaFile } = require('../../../../utils');

module.exports = class SaveMetaFile {
    async process(incoming = {}, outgoing = {}) {
        const { log, nextVersion, integrity, cwd } = incoming;

        log.debug('Saving .eikrc metafile.');
        try {
            const meta = await readMetaFile({ cwd });
            meta.version = nextVersion;
            meta.integrity = integrity;
            await writeMetaFile(meta, { cwd });
        } catch (err) {
            throw new Error(`Unable to save .eikrc metafile: ${err.message}`);
        }

        return outgoing;
    }
};
