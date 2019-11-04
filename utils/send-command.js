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
    map,
} = {}) {
    const form = new FormData();

    if (data) {
        for (const [key, value] of Object.entries(data)) {
            form.append(key, value);
        }
    }

    if (file) {
        form.append('filedata', createReadStream(resolvePath(file).pathname));
    }

    if (map) {
        form.append('map', createReadStream(resolvePath(map).pathname));
    }

    try {
        const url = new URL(pathname, host);

        const res = await fetch(url.href, {
            method,
            body: form,
            headers: form.getHeaders(),
        });

        if (!res.ok) {
            throw new Error(
                `Server responded with a non 200 ok status code. Response: ${res.status}`,
            );
        }
        if (res.headers.get('content-type').includes('application/json')) {
            return { message: await res.json(), status: res.status };
        }
        return { message: await res.text(), status: res.status };
    } catch (err) {
        throw new Error(`Unable to complete command: ${err.message}`);
    }
}

module.exports = sendCommand;
