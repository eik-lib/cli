/* eslint-disable no-param-reassign */

'use strict';

const {
    fetchLatestVersion,
    incrementSemverVersion,
} = require('../../../../utils');
const Task = require('./task');

module.exports = class FetchVersion extends Task {
    async process(incoming = {}, outgoing = {}) {
        const { log } = this;
        const { server, name, major, level } = incoming;
        log.debug(
            'Calculating latest version for package. Fetching previous version information from server.',
        );
        try {
            const version = await fetchLatestVersion(server, name, major);

            if (!version) {
                incoming.version = null;
                outgoing.version = [`${major || '1'}`, '0', '0'].join('.');
            } else {
                incoming.version = version;
                outgoing.version = incrementSemverVersion(version, level);
            }
        } catch (err) {
            throw new Error(
                `Unable to calculate latest version for package: ${err.message}`,
            );
        }

        return outgoing;
    }
};
