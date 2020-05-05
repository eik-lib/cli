'use strict';

module.exports = class DryRun {
    async process(state = {}) {
        const { dryRun, log, js, css, path, zipFile, name } = state;
        if (dryRun) {
            log.debug('Dry run files ready for upload to server:');
            log.debug(`  ==> ${zipFile}`);
            if (js) {
                log.debug(`  ==> ${path}/main/index.js`);
                log.debug(`  ==> ${path}/main/index.js.map`);
                log.debug(`  ==> ${path}/ie11/index.js`);
                log.debug(`  ==> ${path}/ie11/index.js.map`);
            }
            if (css) {
                log.debug(`  ==> ${path}/main/index.css`);
                log.debug(`  ==> ${path}/main/index.css.map`);
            }
            log.info(`Published app package "${name}" (dry run)`);
            return true;
        }

        return state;
    }
};
