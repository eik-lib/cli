'use strict';

const { join } = require('path');
const fetch = require('node-fetch');

module.exports = async (server, name, version = '') => {
    const pkg = join('pkg', name);
    const vers = join(pkg, version);
    const url = new URL(version ? vers : pkg, server);
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

    if (version) {
        const { files = '', integrity = [] } = body || {};
        return { integrity, files };
    }

    return body;
};
