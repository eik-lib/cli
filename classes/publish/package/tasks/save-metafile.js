'use strict';

const { writeMetaFile, readMetaFile } = require('../../../../utils');
const Task = require('./task');

module.exports = class SaveMetaFile extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { cwd } = incoming;
        const { version, integrity } = outgoing;

        log.debug('Saving .eikrc metafile.');
        try {
            const meta = await readMetaFile({ cwd });
            meta.version = version;
            meta.integrity = integrity;
            await writeMetaFile(meta, { cwd });
        } catch (err) {
            throw new Error(`Unable to save .eikrc metafile: ${err.message}`);
        }

        return outgoing;
    }
};
