'use strict';

const { join } = require('path');
const { write: writeJSON, read: readJSON } = require('../../../../utils/json');
const Task = require('./task');

module.exports = class SaveMetaFile extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { cwd, out } = incoming;
        const { version, integrity } = outgoing;
        const filepath = join(out, 'integrity.json');

        log.debug('Saving integrity file');
        log.debug(`  ==> ${filepath}`);
        try {
            const meta = await readJSON({ cwd, filename: filepath });
            meta.version = version;
            meta.integrity = integrity;
            await writeJSON(meta, { cwd, filename: filepath });
        } catch (err) {
            throw new Error(`Unable to save integrity file [${filepath}]: ${err.message}`);
        }

        return outgoing;
    }
};
