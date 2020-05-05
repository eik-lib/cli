/* eslint-disable no-param-reassign */

'use strict';

const {
    fetchLatestVersion,
    incrementSemverVersion,
} = require('../../../../utils');

module.exports = class FetchVersion {
    async process(state = {}) {
        const { log, server, name, major, level } = state;
        log.debug(
            'Calculating latest version for package. Fetching previous version information from server.',
        );
        try {
            const version = await fetchLatestVersion(server, name, major);

            if (!version) {
                state.currentVersion = null;
                state.nextVersion = [`${major || '1'}`, '0', '0'].join('.');
            } else {
                state.currentVersion = version;
                state.nextVersion = incrementSemverVersion(version, level);
            }
        } catch (err) {
            throw new Error(
                `Unable to calculate latest version for package: ${err.message}`,
            );
        }

        return state;
    }
};
