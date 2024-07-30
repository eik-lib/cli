import fetch from 'node-fetch';
import FormData from 'form-data';
import { createReadStream } from 'fs';

/**
 * HTTP Utility for making requests against an Eik server
 *
 * @param {{method:string,host:string,pathname:string,data:object,file:string,map:string,token:string}} options
 *
 * @returns {Promise<{status:number,message:object|string}>} - Promise that resolves to an object with properties status and message
 *
 * @throws Error
 */
async function request(options) {
    const { method = 'POST', host, pathname, data, file, map, token } = options;
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

export default request;
