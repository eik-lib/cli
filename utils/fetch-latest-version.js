'use strict';

const { join } = require('path');
const fetch = require('node-fetch');

module.exports = async (server, org, name, major) => {
    const res = await fetch(`${server}/${join(org, 'pkg', name)}`);
    if (!res.ok) {
        if (res.status === 404) {
            return null;
        }
        throw new Error('Server responded with non 200 status code.');
    }

    let body;
    try {
        body = await res.json();
    } catch (err) {
        throw new Error(
            'An error occurred while attempting to parse json response from server.',
        );
    }

    let versions;
    try {
        versions = new Map(body.versions);
    } catch (err) {
        throw new Error(
            'An error occurred while attempting to create an internal versions map. The JSON returned from the server is most likely invalid.',
        );
    }

    const highestMajor = Math.max(...versions.keys());
    if (Number.isNaN(highestMajor)) {
        throw new Error(
            'An error occurred while attempting to get the highest major version from the internal versions map.',
        );
    }

    try {
        const entry = versions.get(Number(major || highestMajor));
        return entry.version;
    } catch (err) {
        return null;
    }
};
