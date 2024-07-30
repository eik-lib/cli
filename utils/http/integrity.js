import { join } from 'path';
import fetch from 'node-fetch';

/**
 * Fetches package integrity string by name and version from a given Eik asset server.
 *
 * @param {string} server - Eik asset server URL to perform lookup against
 * @param {string} name - Package name to lookup
 * @param {string} version - Semver major version to lock fetch to
 *
 * @returns {Promise<string>} - Package integrity string
 *
 * @throws Error
 */
export default async (server, type, name, version) => {
    const url = new URL(join(type, name, version), server);
    url.search = `?t=${Date.now()}`;

    const res = await fetch(url);

    if (!res.ok) {
        if (res.status === 404) {
            return null;
        }
        throw new Error('Server responded with non 200 status code.');
    }

    try {
        const body = await res.json();
        return body.integrity;
    } catch (err) {
        throw new Error(
            'An error occurred while attempting to parse json response from server.',
        );
    }
};
