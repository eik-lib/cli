'use strict';

const { join } = require('path');
const fetch = require('node-fetch');

module.exports = async (server, org, name, version) => {
    const url = `${server}/${join(org, 'pkg', name, version)}`;

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

    const { files = '', integrity = [] } = body || {};

    return { integrity, files };
};
