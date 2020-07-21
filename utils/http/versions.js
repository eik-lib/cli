'use strict';

const { join } = require('path');
const fetch = require('node-fetch');

/**
 * Fetches package versions by name from a given Eik asset server.
 * 
 * @param {string} server - Eik asset server URL to perform lookup against
 * @param {string} name - Package name to lookup
 * 
 * @returns {Promise<Array<Array<number,{version:string,integrity:string}>>>}
 * 
 * @throws Error
 */
module.exports = async (server, name) => {
    const pkg = join('pkg', name);
    const url = new URL(pkg, server);
    url.search = `?t=${Date.now()}`;

    const res = await fetch(url);

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

    return body.versions;
};
