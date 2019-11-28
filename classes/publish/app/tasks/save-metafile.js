'use strict';

const { writeMetaFile } = require('../../../../utils');

module.exports = class SaveMetaFile {
    async process(state = {}) {
        const { log, version } = state;

        log.debug('Saving .eikrc metafile.');
        try {
            await writeMetaFile({ version, integrity: [] });
        } catch (err) {
            throw new Error(`Unable to save .eikrc metafile: ${err.message}`);
        }

        return state;
    }
};
