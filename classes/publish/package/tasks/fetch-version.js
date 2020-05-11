/* eslint-disable no-param-reassign */

'use strict';

const {
    fetchLatestVersion,
    incrementSemverVersion,
} = require('../../../../utils');

module.exports = class FetchVersion {
    async process(incoming = {}, outgoing = {}) {
        const { log, server, name, major, level } = incoming;
        log.debug(
            'Calculating latest version for package. Fetching previous version information from server.',
        );
        try {
            const version = await fetchLatestVersion(server, name, major);

            if (!version) {
                incoming.currentVersion = null;
                incoming.nextVersion = [`${major || '1'}`, '0', '0'].join('.');
            } else {
                incoming.currentVersion = version;
                incoming.nextVersion = incrementSemverVersion(version, level);
            }
        } catch (err) {
            throw new Error(
                `Unable to calculate latest version for package: ${err.message}`,
            );
        }

        outgoing.version = incoming.nextVersion;

        return outgoing;
    }
};
