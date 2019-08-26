'use strict';

const fetch = require('node-fetch');
const FormData = require('form-data');
const { createReadStream } = require('fs');
const resolvePath = require('./resolve-path');

async function sendCommand({
    method = 'POST',
    host,
    pathname,
    data,
    file,
} = {}) {
    const form = new FormData();

    if (data) {
        form.append('data', JSON.stringify(data));
    }

    if (file) {
        form.append('file', createReadStream(resolvePath(file).pathname));
    }

    try {
        const url = new URL(pathname, host);
        const res = await fetch(url.href, { method, body: form });

        if (!res.ok) {
            throw new Error(
                `Server responded with a non 200 ok status code. Response: ${
                    res.status
                }`
            );
        }

        if (res.headers.contentType === 'application/json') {
            const response = await res.json();
            return { response };
        }

        const response = await res.text();
        return { response };
    } catch (err) {
        throw new Error(`Unable to complete command: ${err.message}`);
    }
}

module.exports = sendCommand;
