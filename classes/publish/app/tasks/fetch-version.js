/* eslint-disable no-param-reassign */

'use strict';

const {
    fetchLatestVersion,
    incrementSemverVersion,
} = require('../../../../utils');

module.exports = class FetchVersion {
    async process(state = {}) {
        const { log, server, org, name, major, level } = state;
        log.debug(
            'Calculating latest version for package. Fetching previous version information from server.',
        );
        try {
            const version = await fetchLatestVersion(server, org, name, major);

            if (!version) {
                state.version = [`${major || '1'}`, '0', '0'].join('.');
            } else {
                state.version = incrementSemverVersion(version, level);
            }
        } catch (err) {
            throw new Error(
                `Unable to calculate latest version for package: ${err.message}`,
            );
        }

        return state;
    }
};
