'use strict';

const fetch = require('node-fetch');
const FormData = require('form-data');
const { createReadStream } = require('fs');

async function request({
    method = 'POST',
    host,
    pathname,
    data,
    file,
    map,
    token,
} = {}) {
    const form = new FormData();
    const headers = {};

    if (data) {
        for (const [key, value] of Object.entries(data)) {
            form.append(key, value);
        }
    }

    if (file) {
        form.append('package', createReadStream(file));
    }

    if (map) {
        form.append('map', createReadStream(map));
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const url = new URL(pathname, host);
        url.search = `?t=${Date.now()}`;

        const res = await fetch(url, {
            method,
            body: form,
            headers: { ...headers, ...form.getHeaders() },
        });

        if (!res.ok) {
            const err = new Error(
                `Server responded with a non 200 ok status code. Response: ${res.status}`,
            );
            err.statusCode = res.status;
            throw err;
        }
        if (res.headers.get('content-type').includes('application/json')) {
            return { message: await res.json(), status: res.status };
        }
        return { message: await res.text(), status: res.status };
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        throw err;
    }
}

module.exports = request;
